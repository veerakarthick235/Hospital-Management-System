# Hospital Management System

A full‑stack application built with **React (frontend)** and **FastAPI (backend)**.  
This system provides secure authentication, patient records management, doctor scheduling, and administrative tools.

---

## 🚀 Features
- Secure User Authentication (JWT)
- Role‑based Access (Admin, Doctor, Nurse, Staff)
- Patient Management System
- Doctor Appointments & Scheduling
- Electronic Medical Records
- Dashboard & Analytics
- RESTful API (FastAPI)
- Responsive UI (React + TailwindCSS)

---

## 🏗️ Tech Stack

### **Frontend**
- React 18
- React Router DOM
- Axios
- TailwindCSS
- Radix UI
- CRACO

### **Backend**
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL / MySQL
- JWT Authentication

---

## 📁 Project Structure

```
Hospital-Management-System-1/
│
├── backend/
│   ├── server.py
│   ├── models/
│   ├── routes/
│   └── database.py
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   ├── App.js
    │   └── index.js
    ├── public/
    ├── package.json
    └── README.md
```

---

## ⚙️ Setup Instructions

### **1️⃣ Backend Setup**

```
cd backend
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
python -m uvicorn server:app --reload
```

Backend runs at:

```
http://localhost:8000
```

---

### **2️⃣ Frontend Setup**

```
cd frontend
npm install --legacy-peer-deps
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔗 Environment Variables

### **Frontend `.env`**
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

### **Backend `.env`**
```
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

---

## 🧪 API Documentation

Once backend is running, open:

```
http://localhost:8000/docs
```

This displays auto‑generated Swagger UI.

---

## 🛡️ Authentication Flow

1. User logs in → backend validates credentials  
2. Backend issues a **JWT token**  
3. Frontend stores token (localStorage)  
4. All protected routes include:

```
Authorization: Bearer <token>
```

---

## 📦 Build for Production

```
cd frontend
npm run build
```

Serve using:
- Netlify  
- Vercel  
- Nginx  
- Apache  

---

## 🤝 Contributing

Pull requests are welcome.  
For major updates, open an issue first to discuss changes.

---

## 📜 License

MIT License © 2025 Hospital Management System Project

