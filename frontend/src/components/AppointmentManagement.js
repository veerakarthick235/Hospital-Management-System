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
  Calendar, 
  CalendarPlus, 
  Clock, 
  User, 
  Search, 
  Edit, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope
} from 'lucide-react';

const AppointmentManagement = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });
  
  const [editData, setEditData] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = appointments.filter(appointment => {
      const patient = patients.find(p => p.id === appointment.patient_id);
      const patientUser = users.find(u => u.id === patient?.user_id);
      const doctor = users.find(u => u.id === appointment.doctor_id);
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        patientUser?.full_name?.toLowerCase().includes(searchLower) ||
        doctor?.full_name?.toLowerCase().includes(searchLower) ||
        appointment.reason?.toLowerCase().includes(searchLower)
      );
      
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
      return dateB - dateA;
    });
    
    setFilteredAppointments(filtered);
  }, [searchTerm, statusFilter, appointments, patients, users]);

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes, usersRes] = await Promise.all([
        axios.get('/appointments'),
        user.role !== 'patient' ? axios.get('/patients') : Promise.resolve({ data: [] }),
        user.role === 'admin' ? axios.get('/users') : Promise.resolve({ data: [] })
      ]);
      
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setUsers(usersRes.data);
      setDoctors(usersRes.data.filter(u => u.role === 'doctor'));
    } catch (error) {
      toast.error('Failed to fetch appointments');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/appointments', formData);
      toast.success('Appointment created successfully!');
      setShowAddDialog(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.patch(`/appointments/${selectedAppointment.id}`, editData);
      toast.success('Appointment updated successfully!');
      setShowEditDialog(false);
      setSelectedAppointment(null);
      setEditData({ status: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no_show': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPatientInfo = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    const patientUser = users.find(u => u.id === patient?.user_id);
    return { patient, user: patientUser };
  };

  const getDoctorInfo = (doctorId) => {
    return users.find(u => u.id === doctorId) || {};
  };

  const formatDateTime = (date, time) => {
    try {
      const dateObj = new Date(`${date} ${time}`);
      return {
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: date, time: time };
    }
  };

  const isUpcoming = (date, time) => {
    try {
      const appointmentDate = new Date(`${date} ${time}`);
      return appointmentDate > new Date();
    } catch {
      return false;
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="space-y-6" data-testid="appointments-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="appointment-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span>Appointment Management</span>
          </h1>
          <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
        </div>
        
        {user.role !== 'patient' && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-appointment-btn">
                <CalendarPlus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id">Patient</Label>
                  <Select 
                    value={formData.patient_id} 
                    onValueChange={(value) => setFormData({...formData, patient_id: value})}
                    required
                  >
                    <SelectTrigger data-testid="appointment-patient-select">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => {
                        const patientUser = users.find(u => u.id === patient.user_id);
                        return (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patientUser?.full_name || 'Unknown'} ({patientUser?.email})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doctor_id">Doctor</Label>
                  <Select 
                    value={formData.doctor_id} 
                    onValueChange={(value) => setFormData({...formData, doctor_id: value})}
                    required
                  >
                    <SelectTrigger data-testid="appointment-doctor-select">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date">Date</Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                      required
                      data-testid="appointment-date-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time">Time</Label>
                    <Input
                      id="appointment_time"
                      type="time"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                      required
                      data-testid="appointment-time-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe the reason for the appointment"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                    data-testid="appointment-reason-input"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} data-testid="create-appointment-btn">
                    {loading ? 'Scheduling...' : 'Schedule'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search appointments by patient, doctor, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="appointment-search-input"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="appointment-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4" data-testid="appointments-list">
          {filteredAppointments.map((appointment) => {
            const { patient, user: patientUser } = getPatientInfo(appointment.patient_id);
            const doctor = getDoctorInfo(appointment.doctor_id);
            const { date, time } = formatDateTime(appointment.appointment_date, appointment.appointment_time);
            const upcoming = isUpcoming(appointment.appointment_date, appointment.appointment_time);
            
            return (
              <Card key={appointment.id} className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
                upcoming ? 'border-l-4 border-l-blue-500' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg text-gray-900" data-testid={`appointment-reason-${appointment.id}`}>
                            {appointment.reason}
                          </h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                          {upcoming && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span data-testid={`appointment-patient-${appointment.id}`}>
                              {patientUser?.full_name || 'Unknown Patient'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="h-4 w-4" />
                            <span data-testid={`appointment-doctor-${appointment.id}`}>
                              Dr. {doctor?.full_name || 'Unknown Doctor'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{date}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{time}</span>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(user.role === 'doctor' || user.role === 'nurse' || user.role === 'admin') && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setEditData({
                              status: appointment.status,
                              notes: appointment.notes || ''
                            });
                            setShowEditDialog(true);
                          }}
                          data-testid={`edit-appointment-${appointment.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No appointments match your search criteria.' 
                : 'No appointments have been scheduled yet.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && user.role !== 'patient' && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule First Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Appointment</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">{selectedAppointment.reason}</h4>
                <p className="text-sm text-blue-700">
                  {formatDateTime(selectedAppointment.appointment_date, selectedAppointment.appointment_time).date} at {' '}
                  {formatDateTime(selectedAppointment.appointment_date, selectedAppointment.appointment_time).time}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editData.status} 
                  onValueChange={(value) => setEditData({...editData, status: value})}
                  required
                >
                  <SelectTrigger data-testid="edit-appointment-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about the appointment"
                  value={editData.notes}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  rows={3}
                  data-testid="edit-appointment-notes-input"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} data-testid="update-appointment-btn">
                  {loading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentManagement;