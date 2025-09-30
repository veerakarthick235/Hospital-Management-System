import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Heart,
  AlertTriangle
} from 'lucide-react';

const PatientManagement = ({ user }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    user_id: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact: '',
    medical_history: '',
    allergies: '',
    current_medications: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient => {
      const user = users.find(u => u.id === patient.user_id);
      const searchLower = searchTerm.toLowerCase();
      return (
        user?.full_name?.toLowerCase().includes(searchLower) ||
        user?.email?.toLowerCase().includes(searchLower) ||
        patient.medical_history?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredPatients(filtered);
  }, [searchTerm, patients, users]);

  const fetchData = async () => {
    try {
      const [patientsRes, usersRes] = await Promise.all([
        axios.get('/patients'),
        user.role === 'admin' ? axios.get('/users') : Promise.resolve({ data: [] })
      ]);
      
      setPatients(patientsRes.data);
      setUsers(usersRes.data);
      setFilteredPatients(patientsRes.data);
    } catch (error) {
      toast.error('Failed to fetch patients');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/patients', formData);
      toast.success('Patient created successfully!');
      setShowAddDialog(false);
      setFormData({
        user_id: '',
        date_of_birth: '',
        gender: '',
        address: '',
        emergency_contact: '',
        medical_history: '',
        allergies: '',
        current_medications: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const getPatientUser = (patient) => {
    return users.find(u => u.id === patient.user_id) || {};
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return 'Unknown';
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="space-y-6" data-testid="patients-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="patient-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <span>Patient Management</span>
          </h1>
          <p className="text-gray-600 mt-1">Manage patient records and medical information</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-patient-btn">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="user_id">Select User</Label>
                  <Select 
                    value={formData.user_id} 
                    onValueChange={(value) => setFormData({...formData, user_id: value})}
                    required
                  >
                    <SelectTrigger data-testid="patient-user-select">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'patient').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    data-testid="patient-dob-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                  >
                    <SelectTrigger data-testid="patient-gender-select">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter patient address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    data-testid="patient-address-input"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    placeholder="Emergency contact information"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                    data-testid="patient-emergency-input"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="medical_history">Medical History</Label>
                  <Textarea
                    id="medical_history"
                    placeholder="Enter medical history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                    rows={3}
                    data-testid="patient-history-input"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    placeholder="List any known allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    data-testid="patient-allergies-input"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="current_medications">Current Medications</Label>
                  <Textarea
                    id="current_medications"
                    placeholder="List current medications"
                    value={formData.current_medications}
                    onChange={(e) => setFormData({...formData, current_medications: e.target.value})}
                    data-testid="patient-medications-input"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} data-testid="create-patient-btn">
                  {loading ? 'Creating...' : 'Create Patient'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients by name, email, or medical history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="patient-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="patients-grid">
          {filteredPatients.map((patient) => {
            const patientUser = getPatientUser(patient);
            return (
              <Card key={patient.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {patientUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`patient-name-${patient.id}`}>
                          {patientUser.full_name || 'Unknown'}
                        </CardTitle>
                        <p className="text-sm text-gray-500" data-testid={`patient-email-${patient.id}`}>
                          {patientUser.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPatient({ ...patient, user: patientUser });
                          setShowViewDialog(true);
                        }}
                        data-testid={`view-patient-${patient.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Age: {calculateAge(patient.date_of_birth)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 capitalize">{patient.gender || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  {patient.allergies && (
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Allergies:</p>
                        <p className="text-sm text-red-600">{patient.allergies}</p>
                      </div>
                    </div>
                  )}
                  
                  {patient.current_medications && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 mb-1">Current Medications:</p>
                      <p className="text-sm text-blue-600">{patient.current_medications}</p>
                    </div>
                  )}
                  
                  {patient.medical_history && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Medical History:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{patient.medical_history}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No patients match your search criteria.' : 'No patients have been added yet.'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Patient Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedPatient.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.user?.full_name}</h3>
                  <p className="text-gray-600">{selectedPatient.user?.email}</p>
                  <Badge className="mt-1">{calculateAge(selectedPatient.date_of_birth)}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                    <p className="mt-1 text-gray-900">{formatDate(selectedPatient.date_of_birth)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Gender</Label>
                    <p className="mt-1 text-gray-900 capitalize">{selectedPatient.gender || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <p className="mt-1 text-gray-900">{selectedPatient.user?.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Emergency Contact</Label>
                    <p className="mt-1 text-gray-900">{selectedPatient.emergency_contact || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Address</Label>
                    <p className="mt-1 text-gray-900">{selectedPatient.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              {selectedPatient.allergies && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Label className="text-sm font-medium text-red-700 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Allergies
                  </Label>
                  <p className="mt-1 text-red-600">{selectedPatient.allergies}</p>
                </div>
              )}
              
              {selectedPatient.current_medications && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Current Medications</Label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedPatient.current_medications}</p>
                </div>
              )}
              
              {selectedPatient.medical_history && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Medical History</Label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedPatient.medical_history}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;