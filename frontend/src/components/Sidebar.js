import React from 'react';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Brain, 
  LogOut, 
  Heart,
  UserCheck
} from 'lucide-react';

const Sidebar = ({ user, activeSection, setActiveSection, onLogout }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'nurse', 'patient']
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      roles: ['admin', 'doctor', 'nurse']
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      roles: ['admin', 'doctor', 'nurse', 'patient']
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: FileText,
      roles: ['admin', 'doctor', 'patient']
    },
    {
      id: 'ai-docs',
      label: 'AI Documentation',
      icon: Brain,
      roles: ['doctor', 'nurse']
    }
  ];

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-red-500 to-red-600',
      doctor: 'from-blue-500 to-blue-600',
      nurse: 'from-green-500 to-green-600',
      patient: 'from-purple-500 to-purple-600'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👨‍💼';
      case 'doctor': return '👨‍⚕️';
      case 'nurse': return '👩‍⚕️';
      case 'patient': return '🏥';
      default: return '👤';
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MedCare HMS</h1>
            <p className="text-sm text-gray-500">Hospital Management</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} flex items-center justify-center text-white font-semibold text-lg`}>
            {getRoleIcon(user.role)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" data-testid="user-name">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize flex items-center" data-testid="user-role">
              <UserCheck className="h-3 w-3 mr-1" />
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems
          .filter(item => item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start space-x-3 py-3 px-4 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setActiveSection(item.id)}
                data-testid={`nav-${item.id}-btn`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })
        }
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full justify-start space-x-3 py-3 px-4 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          onClick={onLogout}
          data-testid="logout-btn"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;