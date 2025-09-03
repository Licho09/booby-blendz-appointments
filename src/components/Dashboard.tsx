import React from 'react';
import { Calendar, Clock, Users, DollarSign, ChevronRight } from 'lucide-react';
import type { Appointment, Client, View } from '../types';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  onNavigate: (view: View) => void;
  theme: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ appointments, clients, onNavigate, theme }) => {
  const today = new Date().toDateString();
  const todayAppointments = appointments.filter(apt => 
    new Date(apt.date).toDateString() === today && apt.status === 'scheduled'
  ).length;
  
  const scheduledAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.date) >= new Date()
  ).length;
  
  const totalAppointments = appointments.length;
  
  // Calculate today's earnings (assuming $50 per completed appointment for demo)
  const todayEarnings = appointments.filter(apt => 
    new Date(apt.date).toDateString() === today && apt.status === 'completed'
  ).length * 50;

  const stats = [
    { 
      label: 'Today', 
      count: todayAppointments, 
      icon: Calendar, 
      color: 'bg-blue-500',
      view: 'appointments' as View
    },
    { 
      label: 'Scheduled', 
      count: scheduledAppointments, 
      icon: Clock, 
      color: 'bg-orange-500',
      view: 'appointments' as View
    },
    { 
      label: 'All', 
      count: totalAppointments, 
      icon: Users, 
      color: 'bg-gray-500',
      view: 'appointments' as View
    },
    { 
      label: 'Earnings', 
      count: `$${todayEarnings}`, 
      icon: DollarSign, 
      color: 'bg-green-500',
      view: 'earnings' as View
    },
  ];

  const lists = [
    { 
      label: 'Today\'s Appointments', 
      count: todayAppointments, 
      icon: '📅', 
      color: 'bg-purple-500',
      view: 'appointments' as View
    },
    { 
      label: 'All Clients', 
      count: clients.length, 
      icon: '👥', 
      color: 'bg-green-500',
      view: 'appointments' as View
    },
    { 
      label: 'This Week', 
      count: appointments.filter(apt => {
        const appointmentDate = new Date(apt.date);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return appointmentDate >= weekStart && appointmentDate <= weekEnd && apt.status === 'scheduled';
      }).length, 
      icon: '📊', 
      color: 'bg-orange-500',
      view: 'appointments' as View
    },
    { 
      label: 'Completed', 
      count: appointments.filter(apt => apt.status === 'completed').length, 
      icon: '✅', 
      color: 'bg-blue-500',
      view: 'appointments' as View
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => {
                if (stat.action) {
                  stat.action();
                } else if (stat.view) onNavigate(stat.view);
              }}
              className={`p-4 rounded-xl transition-all duration-200 hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-50'
              } shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-full ${stat.color} flex items-center justify-center`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold">{typeof stat.count === 'string' ? stat.count : stat.count}</div>
              </div>
              <div className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {stat.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* My Lists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Quick Access</h2>
          <ChevronRight className={`w-5 h-5 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
        
        <div className="space-y-2">
          {lists.map((list) => (
            <button
              key={list.label}
              onClick={() => onNavigate(list.view)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-50'
              } shadow-sm`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${list.color} flex items-center justify-center text-white text-sm`}>
                  {list.icon}
                </div>
                <span className="font-medium">{list.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {list.count}
                </span>
                <ChevronRight className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;