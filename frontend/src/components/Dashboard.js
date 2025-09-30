import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Activity,
  Heart,
  Stethoscope
} from 'lucide-react';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes, billsRes] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/appointments'),
        axios.get('/bills')
      ]);
      
      setStats(statsRes.data);
      setRecentAppointments(appointmentsRes.data.slice(0, 5));
      setRecentBills(billsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderStatsCards = () => {
    if (user.role === 'patient') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">My Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900" data-testid="patient-appointments-count">
                {stats?.appointments || 0}
              </div>
              <p className="text-sm text-blue-600 mt-1">Total scheduled</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">My Bills</CardTitle>
              <FileText className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900" data-testid="patient-bills-count">
                {stats?.bills || 0}
              </div>
              <p className="text-sm text-green-600 mt-1">Outstanding bills</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Patients</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900" data-testid="total-patients-count">
              {stats?.total_patients || 0}
            </div>
            <Progress value={75} className="mt-2" />
            <p className="text-sm text-blue-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Appointments</CardTitle>
            <Calendar className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900" data-testid="total-appointments-count">
              {stats?.total_appointments || 0}
            </div>
            <Progress value={85} className="mt-2" />
            <p className="text-sm text-green-600 mt-1">+8% from last week</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Bills</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900" data-testid="total-bills-count">
              {stats?.total_bills || 0}
            </div>
            <Progress value={65} className="mt-2" />
            <p className="text-sm text-purple-600 mt-1">Revenue tracking</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending Bills</CardTitle>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900" data-testid="pending-bills-count">
              {stats?.pending_bills || 0}
            </div>
            <Progress value={30} className="mt-2" />
            <p className="text-sm text-amber-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="dashboard-content">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-16 -translate-y-8">
          <div className="w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 left-0 transform -translate-x-8 translate-y-8">
          <div className="w-24 h-24 bg-white/10 rounded-full"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-greeting">
            {getGreeting()}, {user.full_name}!
          </h1>
          <p className="text-white/90 text-lg">
            Welcome to your {user.role} dashboard. Here's what's happening today.
          </p>
          <div className="flex items-center mt-4 space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm">System Status: Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span className="text-sm">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Recent Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments.length > 0 ? (
              <div className="space-y-4" data-testid="recent-appointments-list">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.reason}</p>
                        <p className="text-sm text-gray-500">
                          {appointment.appointment_date} at {appointment.appointment_time}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="no-appointments-message">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Recent Bills</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBills.length > 0 ? (
              <div className="space-y-4" data-testid="recent-bills-list">
                {recentBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{bill.description}</p>
                        <p className="text-sm text-gray-500">Due: {bill.due_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${bill.amount}</p>
                      <Badge className={getStatusColor(bill.status)}>
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="no-bills-message">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent bills</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Documentation Quick Access */}
      {(user.role === 'doctor' || user.role === 'nurse') && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span>AI-Powered Documentation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">
                  Generate comprehensive medical notes with Claude Sonnet 4
                </p>
                <p className="text-sm text-gray-500">
                  Save time with AI-assisted documentation for patient visits
                </p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Try AI Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;