import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, Plus, Moon, Sun, Instagram, LogOut } from 'lucide-react';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import ClientForm from './components/ClientForm';
import EarningsView from './components/EarningsView';
import Login from './components/Login';
import Signup from './components/Signup';
import { useAppointments } from './hooks/useAppointments';
import { useClients } from './hooks/useClients';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { authAPI } from './services/api';
import type { View } from './types';

function App() {
  const [currentView, setCurrentView] = useState<View>('appointments');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { appointments, addAppointment, updateAppointment, deleteAppointment, isLoading: appointmentsLoading, error: appointmentsError, refreshAppointments } = useAppointments();
  const { clients, addClient, updateClient, isLoading: clientsLoading } = useClients();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading, login, signup, logout } = useAuth();

  // Token expiration is now handled automatically by API requests
  // No need for periodic checks that cause reload loops

  // Test message to see if app is loading
  console.log('App is loading! Current view:', currentView);

  // Function to handle view changes with scroll reset
  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
    // Reset scroll position to top when switching views
    window.scrollTo(0, 0);
  };

  const handleEditAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowAppointmentForm(true);
  };


  const handleAppointmentSubmit = async (appointmentData: any) => {
    try {
      // Check if we need to create a new client
      const existingClient = clients.find(client => 
        client.name.toLowerCase() === appointmentData.clientName.toLowerCase()
      );
      
      let clientId = appointmentData.clientId; // Initialize with existing or placeholder
      
      if (!existingClient) {
        // This is a new client, create it first
        const newClient = {
          name: appointmentData.clientName,
          phone: '',
          email: '',
          notes: ''
        };
        
        console.log('Creating new client:', newClient);
        const clientResult = await addClient(newClient);
        console.log('Client creation result:', clientResult);
        
        if (clientResult.success) {
          clientId = clientResult.client.id;
          console.log('Client created successfully with ID:', clientId);
        } else {
          console.error('Client creation failed:', clientResult.error);
          throw new Error(`Failed to create client: ${clientResult.error || 'Unknown error'}`);
        }
      } else {
        clientId = existingClient.id;
      }

      // Now create the appointment with the proper data structure
      const appointmentToCreate = {
        clientId: clientId,
        title: appointmentData.clientName, // Use client name as title
        date: appointmentData.date,
        time: appointmentData.time,
        duration: appointmentData.duration,
        price: appointmentData.price,
        notes: appointmentData.notes,
        status: appointmentData.status
      };

      if (selectedAppointmentId) {
        await updateAppointment(selectedAppointmentId, appointmentToCreate);
      } else {
        await addAppointment(appointmentToCreate);
      }
      
      setShowAppointmentForm(false);
      setSelectedAppointmentId(null);
    } catch (error) {
      console.error('Error handling appointment:', error);
      alert('Failed to create appointment. Please try again.');
    }
  };

  const handleClientSubmit = async (clientData: any) => {
    try {
      if (selectedClientId) {
        await updateClient(selectedClientId, clientData);
      } else {
        await addClient(clientData);
      }
      setShowClientForm(false);
      setSelectedClientId(null);
    } catch (error) {
      console.error('Error handling client:', error);
    }
  };

  const handleCloseForm = () => {
    setShowAppointmentForm(false);
    setShowClientForm(false);
    setSelectedAppointmentId(null);
    setSelectedClientId(null);
  };

  const selectedAppointment = selectedAppointmentId 
    ? appointments.find(apt => apt.id === selectedAppointmentId)
    : undefined;

  const selectedClient = selectedClientId 
    ? clients.find(client => client.id === selectedClientId)
    : undefined;

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const result = await login(credentials);
    if (!result.success) {
      // Handle login error
      console.error('Login failed:', result.error);
      alert(`Login failed: ${result.error}`);
    }
  };

  const handleSignup = async (userData: { email: string; password: string; confirmPassword: string }) => {
    const result = await signup(userData);
    if (!result.success) {
      // Handle signup error
      console.error('Signup failed:', result.error);
      alert(`Signup failed: ${result.error}`);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      logout();
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login 
        onLogin={handleLogin}
        onSwitchToSignup={() => setAuthView('signup')}
        isLoading={isLoading}
      />
    ) : (
      <Signup 
        onSignup={handleSignup}
        onSwitchToLogin={() => setAuthView('login')}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900'
    }`}>
      {/* Status Bar */}
      <div className={`flex items-center justify-between p-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-4">
          <Instagram className="w-8 h-8 text-white" />
        </div>
        
        <div className="flex-1 flex justify-center">
          <h1 className={`text-2xl font-bold font-['Dancing Script'] ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Booby_Blendz
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLogout}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {currentView === 'appointments' && (
          <AppointmentList
            appointments={appointments}
            clients={clients}
            onEdit={handleEditAppointment}
            onDelete={deleteAppointment}
            onMarkComplete={async (appointmentId, price) => {
              try {
                const appointment = appointments.find(apt => apt.id === appointmentId);
                if (appointment) {
                  // Only send the fields that the database expects
                  const updateData = {
                    clientId: appointment.clientId,
                    title: appointment.title,
                    date: appointment.date,
                    time: appointment.time,
                    duration: appointment.duration,
                    price: price || appointment.price || 0,
                    notes: appointment.notes,
                    status: 'completed' as const
                  };
                  await updateAppointment(appointmentId, updateData);
                }
              } catch (error) {
                console.error('Error marking appointment complete:', error);
              }
            }}
            theme={theme}
            isLoading={appointmentsLoading}
            error={appointmentsError}
            onRetry={refreshAppointments}
          />
        )}
        
        {currentView === 'earnings' && (
          <EarningsView
            appointments={appointments}
            onBack={() => handleViewChange('appointments')}
            theme={theme}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex justify-center items-center max-w-md mx-auto">
          <div className="flex items-center justify-between w-full px-4">
            <button
              onClick={() => handleViewChange('appointments')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors flex-1 ${
                currentView === 'appointments'
                  ? 'text-blue-500'
                  : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-6 h-6" />
              <span className="text-xs font-medium">Appointments</span>
            </button>
            
            <button
              onClick={() => setShowAppointmentForm(true)}
              className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 mx-4 -mt-4 sm:mt-0"
            >
              <Plus className="w-8 h-8 text-white stroke-4" />
            </button>
            
            <button
              onClick={() => handleViewChange('earnings')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors flex-1 ${
                currentView === 'earnings'
                  ? 'text-blue-500'
                  : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-xs font-medium">Earnings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forms */}
      {showAppointmentForm && (
        <AppointmentForm
          appointment={selectedAppointment}
          clients={clients}
          onSubmit={handleAppointmentSubmit}
          onClose={handleCloseForm}
          theme={theme}
        />
      )}

      {showClientForm && (
        <ClientForm
          client={selectedClient}
          onSubmit={handleClientSubmit}
          onClose={handleCloseForm}
          theme={theme}
        />
      )}
    </div>
  );
}

export default App;