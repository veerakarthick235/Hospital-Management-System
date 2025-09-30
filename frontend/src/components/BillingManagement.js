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
  FileText, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  User,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const BillingManagement = ({ user }) => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    description: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = bills.filter(bill => {
      const patient = patients.find(p => p.id === bill.patient_id);
      const patientUser = users.find(u => u.id === patient?.user_id);
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        patientUser?.full_name?.toLowerCase().includes(searchLower) ||
        bill.description?.toLowerCase().includes(searchLower) ||
        bill.amount?.toString().includes(searchLower)
      );
      
      const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredBills(filtered);
  }, [searchTerm, statusFilter, bills, patients, users]);

  const fetchData = async () => {
    try {
      const [billsRes, patientsRes, appointmentsRes, usersRes] = await Promise.all([
        axios.get('/bills'),
        user.role !== 'patient' ? axios.get('/patients') : Promise.resolve({ data: [] }),
        user.role !== 'patient' ? axios.get('/appointments') : Promise.resolve({ data: [] }),
        user.role === 'admin' ? axios.get('/users') : Promise.resolve({ data: [] })
      ]);
      
      setBills(billsRes.data);
      setPatients(patientsRes.data);
      setAppointments(appointmentsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Failed to fetch billing data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        appointment_id: formData.appointment_id || null
      };
      
      await axios.post('/bills', submitData);
      toast.success('Bill created successfully!');
      setShowAddDialog(false);
      setFormData({
        patient_id: '',
        appointment_id: '',
        description: '',
        amount: '',
        due_date: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPatientInfo = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    const patientUser = users.find(u => u.id === patient?.user_id);
    return { patient, user: patientUser };
  };

  const getAppointmentInfo = (appointmentId) => {
    return appointments.find(a => a.id === appointmentId);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isOverdue = (dueDate) => {
    try {
      return new Date(dueDate) < new Date() && bills.find(b => b.due_date === dueDate)?.status === 'pending';
    } catch {
      return false;
    }
  };

  const getTotalStats = () => {
    const total = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = filteredBills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0);
    const pending = filteredBills.filter(b => b.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0);
    const overdue = filteredBills.filter(b => b.status === 'overdue').reduce((sum, bill) => sum + bill.amount, 0);
    
    return { total, paid, pending, overdue };
  };

  const stats = getTotalStats();

  if (loading && bills.length === 0) {
    return (
      <div className="space-y-6" data-testid="billing-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
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
    <div className="space-y-6 fade-in" data-testid="billing-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <span>Billing Management</span>
          </h1>
          <p className="text-gray-600 mt-1">Manage patient bills and payments</p>
        </div>
        
        {(user.role === 'admin' || user.role === 'doctor') && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-bill-btn">
                <Plus className="h-4 w-4 mr-2" />
                Create Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id">Patient</Label>
                  <Select 
                    value={formData.patient_id} 
                    onValueChange={(value) => setFormData({...formData, patient_id: value})}
                    required
                  >
                    <SelectTrigger data-testid="bill-patient-select">
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
                  <Label htmlFor="appointment_id">Related Appointment (Optional)</Label>
                  <Select 
                    value={formData.appointment_id} 
                    onValueChange={(value) => setFormData({...formData, appointment_id: value})}
                  >
                    <SelectTrigger data-testid="bill-appointment-select">
                      <SelectValue placeholder="Select appointment (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No appointment</SelectItem>
                      {appointments
                        .filter(apt => apt.patient_id === formData.patient_id)
                        .map((appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {appointment.reason} - {formatDate(appointment.appointment_date)}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the services or items billed"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    data-testid="bill-description-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                    data-testid="bill-amount-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    required
                    data-testid="bill-due-date-input"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} data-testid="create-bill-btn">
                    {loading ? 'Creating...' : 'Create Bill'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      {user.role !== 'patient' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Revenue</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900" data-testid="total-revenue">
                {formatCurrency(stats.total)}
              </div>
              <p className="text-sm text-blue-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Paid</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900" data-testid="paid-amount">
                {formatCurrency(stats.paid)}
              </div>
              <p className="text-sm text-green-600 mt-1">Collected</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900" data-testid="pending-amount">
                {formatCurrency(stats.pending)}
              </div>
              <p className="text-sm text-yellow-600 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900" data-testid="overdue-amount">
                {formatCurrency(stats.overdue)}
              </div>
              <p className="text-sm text-red-600 mt-1">Past due</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bills by patient, description, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="bill-search-input"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="bill-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      {filteredBills.length > 0 ? (
        <div className="space-y-4" data-testid="bills-list">
          {filteredBills.map((bill) => {
            const { patient, user: patientUser } = getPatientInfo(bill.patient_id);
            const appointment = getAppointmentInfo(bill.appointment_id);
            const overdue = isOverdue(bill.due_date);
            
            return (
              <Card key={bill.id} className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
                overdue ? 'border-l-4 border-l-red-500' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg text-gray-900" data-testid={`bill-description-${bill.id}`}>
                            {bill.description}
                          </h3>
                          <Badge className={getStatusColor(bill.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(bill.status)}
                              <span className="capitalize">{bill.status}</span>
                            </div>
                          </Badge>
                          {overdue && (
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span data-testid={`bill-patient-${bill.id}`}>
                              {patientUser?.full_name || 'Unknown Patient'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {formatDate(bill.due_date)}</span>
                          </div>
                          
                          {appointment && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>Related: {appointment.reason}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Created: {formatDate(bill.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900" data-testid={`bill-amount-${bill.id}`}>
                        {formatCurrency(bill.amount)}
                      </div>
                      {user.role === 'patient' && bill.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="mt-2 bg-green-600 hover:bg-green-700"
                          data-testid={`pay-bill-${bill.id}`}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No bills match your search criteria.' 
                : 'No bills have been created yet.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (user.role === 'admin' || user.role === 'doctor') && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Bill
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingManagement;