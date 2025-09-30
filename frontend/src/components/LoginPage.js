import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Heart, Activity, Users, Calendar } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'patient',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/auth/login', loginData);
      onLogin(response.data.user, response.data.access_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/auth/register', registerData);
      toast.success('Registration successful! Please login.');
      setRegisterData({
        email: '',
        password: '',
        full_name: '',
        role: 'patient',
        phone: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const demoCredentials = {
      admin: { email: 'admin@hospital.com', password: 'admin123' },
      doctor: { email: 'doctor@hospital.com', password: 'doctor123' },
      nurse: { email: 'nurse@hospital.com', password: 'nurse123' },
      patient: { email: 'patient@hospital.com', password: 'patient123' }
    };

    setLoading(true);
    try {
      const response = await axios.post('/auth/login', demoCredentials[role]);
      onLogin(response.data.user, response.data.access_token);
      toast.success(`Logged in as demo ${role}`);
    } catch (error) {
      toast.error(`Demo ${role} account not found. Please create one first.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      <div className="w-full max-w-6xl flex items-center gap-12">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-1 flex-col justify-center space-y-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="p-3 bg-blue-600 rounded-2xl">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">MedCare HMS</h1>
            </div>
            
            <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
              Advanced Hospital Management System with AI-powered medical documentation
            </p>
            
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="p-3 bg-blue-100 rounded-lg inline-block mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Patient Management</h3>
                <p className="text-sm text-gray-600">Complete patient records and history</p>
              </div>
              
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="p-3 bg-green-100 rounded-lg inline-block mb-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
                <p className="text-sm text-gray-600">Intelligent appointment management</p>
              </div>
              
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="p-3 bg-purple-100 rounded-lg inline-block mb-3">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Documentation</h3>
                <p className="text-sm text-gray-600">Claude-powered medical notes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 max-w-md">
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your hospital dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        data-testid="login-email-input"
                        className="bg-white/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        data-testid="login-password-input"
                        className="bg-white/50"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg"
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                  
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Try Demo Accounts</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => demoLogin('admin')}
                        disabled={loading}
                        className="text-sm bg-white/50 hover:bg-red-50 border-red-200 text-red-700"
                        data-testid="demo-admin-btn"
                      >
                        Admin
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => demoLogin('doctor')}
                        disabled={loading}
                        className="text-sm bg-white/50 hover:bg-blue-50 border-blue-200 text-blue-700"
                        data-testid="demo-doctor-btn"
                      >
                        Doctor
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => demoLogin('nurse')}
                        disabled={loading}
                        className="text-sm bg-white/50 hover:bg-green-50 border-green-200 text-green-700"
                        data-testid="demo-nurse-btn"
                      >
                        Nurse
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => demoLogin('patient')}
                        disabled={loading}
                        className="text-sm bg-white/50 hover:bg-purple-50 border-purple-200 text-purple-700"
                        data-testid="demo-patient-btn"
                      >
                        Patient
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        placeholder="Dr. John Smith"
                        value={registerData.full_name}
                        onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                        required
                        data-testid="register-name-input"
                        className="bg-white/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="john@hospital.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        data-testid="register-email-input"
                        className="bg-white/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone (Optional)</Label>
                      <Input
                        id="reg-phone"
                        placeholder="+1 (555) 123-4567"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        data-testid="register-phone-input"
                        className="bg-white/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-role">Role</Label>
                      <Select 
                        value={registerData.role} 
                        onValueChange={(value) => setRegisterData({...registerData, role: value})}
                      >
                        <SelectTrigger data-testid="register-role-select" className="bg-white/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient">Patient</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                        data-testid="register-password-input"
                        className="bg-white/50"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg"
                      disabled={loading}
                      data-testid="register-submit-btn"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;