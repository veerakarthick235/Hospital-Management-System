from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
security = HTTPBearer()
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI(title="Hospital Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    PATIENT = "patient"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class BillingStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"

# Database Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientCreate(BaseModel):
    user_id: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    appointment_date: str
    appointment_time: str
    reason: str
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    notes: Optional[str] = None
    ai_generated_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: str
    appointment_time: str
    reason: str

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None

class Bill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    appointment_id: Optional[str] = None
    description: str
    amount: float
    status: BillingStatus = BillingStatus.PENDING
    due_date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BillCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    description: str
    amount: float
    due_date: str

class AIDocumentationRequest(BaseModel):
    appointment_id: str
    patient_symptoms: str
    examination_findings: str
    treatment_plan: str

# Security functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_TIME_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

def require_role(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Basic route
@api_router.get("/")
async def root():
    return {"message": "Hospital Management System API", "status": "running"}

# Authentication endpoints
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    user_data_to_store = user_obj.dict()
    user_data_to_store["hashed_password"] = hashed_password
    
    await db.users.insert_one(user_data_to_store)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_obj = User(**user)
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Patient endpoints
@api_router.post("/patients", response_model=Patient)
async def create_patient(
    patient_data: PatientCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
):
    patient_obj = Patient(**patient_data.dict())
    await db.patients.insert_one(patient_obj.dict())
    return patient_obj

@api_router.get("/patients", response_model=List[Patient])
async def get_patients(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
):
    patients = await db.patients.find().to_list(1000)
    return [Patient(**patient) for patient in patients]

@api_router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    # Patients can only view their own data
    if current_user.role == UserRole.PATIENT:
        patient = await db.patients.find_one({"user_id": current_user.id})
    else:
        patient = await db.patients.find_one({"id": patient_id})
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return Patient(**patient)

# Appointment endpoints
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user)
):
    appointment_obj = Appointment(**appointment_data.dict())
    await db.appointments.insert_one(appointment_obj.dict())
    return appointment_obj

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.PATIENT:
        # Get patient data first
        patient = await db.patients.find_one({"user_id": current_user.id})
        if not patient:
            return []
        appointments = await db.appointments.find({"patient_id": patient["id"]}).to_list(1000)
    elif current_user.role == UserRole.DOCTOR:
        appointments = await db.appointments.find({"doctor_id": current_user.id}).to_list(1000)
    else:
        appointments = await db.appointments.find().to_list(1000)
    
    return [Appointment(**appointment) for appointment in appointments]

@api_router.patch("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]))
):
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.appointments.update_one({"id": appointment_id}, {"$set": update_dict})
        appointment.update(update_dict)
    
    return Appointment(**appointment)

# Billing endpoints
@api_router.post("/bills", response_model=Bill)
async def create_bill(
    bill_data: BillCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR]))
):
    bill_obj = Bill(**bill_data.dict())
    await db.bills.insert_one(bill_obj.dict())
    return bill_obj

@api_router.get("/bills", response_model=List[Bill])
async def get_bills(
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.PATIENT:
        patient = await db.patients.find_one({"user_id": current_user.id})
        if not patient:
            return []
        bills = await db.bills.find({"patient_id": patient["id"]}).to_list(1000)
    else:
        bills = await db.bills.find().to_list(1000)
    
    return [Bill(**bill) for bill in bills]

# AI Documentation endpoint
@api_router.post("/ai/generate-notes")
async def generate_ai_notes(
    request: AIDocumentationRequest,
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.NURSE]))
):
    try:
        # Initialize Claude chat
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"medical_notes_{request.appointment_id}",
            system_message="You are a medical documentation assistant. Generate comprehensive, professional medical notes based on the provided information. Focus on clarity, accuracy, and proper medical terminology."
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
        # Create prompt for medical documentation
        prompt = f"""
Please generate comprehensive medical notes based on the following information:

Patient Symptoms: {request.patient_symptoms}
Examination Findings: {request.examination_findings}
Treatment Plan: {request.treatment_plan}

Format the notes professionally with sections for:
1. Chief Complaint
2. History of Present Illness
3. Physical Examination
4. Assessment
5. Plan

Ensure all medical terminology is accurate and the documentation is suitable for medical records.
"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Update appointment with AI-generated notes
        await db.appointments.update_one(
            {"id": request.appointment_id},
            {"$set": {"ai_generated_notes": response}}
        )
        
        return {"generated_notes": response, "appointment_id": request.appointment_id}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AI notes: {str(e)}"
        )

# Dashboard stats endpoint
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.PATIENT:
        patient = await db.patients.find_one({"user_id": current_user.id})
        if not patient:
            return {"appointments": 0, "bills": 0}
        
        appointment_count = await db.appointments.count_documents({"patient_id": patient["id"]})
        bill_count = await db.bills.count_documents({"patient_id": patient["id"]})
        
        return {
            "appointments": appointment_count,
            "bills": bill_count
        }
    else:
        total_patients = await db.patients.count_documents({})
        total_appointments = await db.appointments.count_documents({})
        total_bills = await db.bills.count_documents({})
        pending_bills = await db.bills.count_documents({"status": "pending"})
        
        return {
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "total_bills": total_bills,
            "pending_bills": pending_bills
        }

# Users endpoint for admin
@api_router.get("/users", response_model=List[User])
async def get_users(
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
