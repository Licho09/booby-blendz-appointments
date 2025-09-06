import React, { useState } from 'react';
import { Edit3, Trash2, Search, User, Clock, Calendar, X } from 'lucide-react';
import type { Appointment, Client } from '../types';

interface AppointmentListProps {
  appointments: Appointment[];
  clients: Client[];
  onEdit: (appointmentId: string) => void;
  onDelete: (appointmentId: string) => void;
  onMarkComplete: (appointmentId: string, price?: number) => void;
  theme: 'light' | 'dark';
}

const AppointmentList: React.FC<AppointmentListProps> = ({ 
  appointments, 
  clients, 
  onEdit, 
  onDelete, 
  onMarkComplete,
  theme 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'pending' | 'completed'>('today');
  const [completedFilter, setCompletedFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [priceInput, setPriceInput] = useState('');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [deletingAppointments, setDeletingAppointments] = useState<Set<string>>(new Set());

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString();
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const handleDelete = async (appointmentId: string) => {
    setDeletingAppointments(prev => new Set(prev).add(appointmentId));
    try {
      await onDelete(appointmentId);
    } finally {
      setDeletingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const clientName = getClientName(appointment.clientId);
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const today = new Date().toLocaleDateString('en-CA');
    const appointmentDate = appointment.date;
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return appointmentDate === today;
      case 'upcoming':
        return appointmentDate > today;
      case 'pending':
        return appointment.status === 'pending';
      case 'completed':
        if (appointment.status !== 'completed') return false;
        
        // Apply completed filter
        switch (completedFilter) {
          case 'today':
            return appointmentDate === today;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appointmentDateTime >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return appointmentDateTime >= monthAgo;
          case 'all':
            return true;
          default:
            return true;
        }
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by date and time chronologically
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleDoneClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowPriceModal(true);
    setPriceInput('');
  };

  const handlePriceSubmit = () => {
    const price = parseFloat(priceInput);
    if (!isNaN(price) && price >= 0) {
      onMarkComplete(selectedAppointmentId, price);
      setShowPriceModal(false);
      setPriceInput('');
    }
  };

  const handleCloseModal = () => {
    setShowPriceModal(false);
    setPriceInput('');
  };

  const getCompletedStats = () => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const now = new Date();
    
            const today = completedAppointments.filter(apt => apt.date === getTodayString());
    const thisWeek = completedAppointments.filter(apt => {
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return aptDate >= weekAgo;
    });
    const thisMonth = completedAppointments.filter(apt => {
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return aptDate >= monthAgo;
    });

    return {
      today: {
        count: today.length,
        earnings: today.reduce((sum, apt) => sum + (apt.price || 0), 0)
      },
      week: {
        count: thisWeek.length,
        earnings: thisWeek.reduce((sum, apt) => sum + (apt.price || 0), 0)
      },
      month: {
        count: thisMonth.length,
        earnings: thisMonth.reduce((sum, apt) => sum + (apt.price || 0), 0)
      }
    };
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <div className="text-sm text-gray-500">
          {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'today', label: 'Today' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                filter === filterOption.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : theme === 'dark'
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Completed Filter Options */}
        {filter === 'completed' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const stats = getCompletedStats();
                return [
                  { label: 'Today', data: stats.today },
                  { label: 'This Week', data: stats.week },
                  { label: 'This Month', data: stats.month }
                ].map((stat) => (
                  <div key={stat.label} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg text-center shadow-lg">
                    <div className="text-sm font-medium mb-1">{stat.label}</div>
                    <div className="text-4xl font-bold">{stat.data.count}</div>
                    <div className="text-xs opacity-90">appointments</div>
                  </div>
                ));
              })()}
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'all', label: 'All Time' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setCompletedFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    completedFilter === filterOption.key
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : theme === 'dark'
                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className={`text-center py-12 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No appointments found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          (() => {
            if (filter === 'today') {
              const today = getTodayString();
              const todayAppointments = filteredAppointments.filter(apt => apt.date === today);
              const upcomingToday = todayAppointments.filter(apt => apt.status !== 'completed');
              const completedToday = todayAppointments.filter(apt => apt.status === 'completed');
              
              return (
                <div className="space-y-6">
                  {/* Upcoming Today Section */}
                  {upcomingToday.length > 0 && (
                    <div>
                      <div className={`flex items-center space-x-2 mb-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <h3 className="font-semibold text-sm uppercase tracking-wide">Upcoming Today</h3>
                        <span className="text-xs text-gray-500">({upcomingToday.length})</span>
                      </div>
                      <div className="space-y-3">
                        {upcomingToday.map((appointment) => (
                          <div
                            key={appointment.id}
                            className={`p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                              theme === 'dark' 
                                ? 'bg-gray-800 hover:bg-gray-700' 
                                : 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
                            } shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}
                          >
                            <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                              <div className="flex-1 space-y-2 w-full sm:w-auto">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-6 h-6 text-gray-400" />
                                    <span className="text-2xl font-semibold">{getClientName(appointment.clientId)}</span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                    {appointment.status}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDisplayDate(appointment.date)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="font-semibold text-green-600">${(appointment.price || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                {appointment.notes && (
                                  <div className={`text-sm p-2 rounded-lg ${
                                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
                                  }`}>
                                    {appointment.notes}
                                  </div>
                                )}
                              </div>
                              
                              {/* Mobile-first responsive layout */}
                              <div className="flex flex-col items-end space-y-3 ml-0 sm:ml-4 w-full sm:w-auto">
                                {/* Time Display */}
                                <div className="text-right">
                                  <div className={`text-2xl sm:text-4xl font-bold ${
                                    theme === 'dark' ? 'text-white' : 'text-blue-600'
                                  }`}>
                                    {formatTime(appointment.time)}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    {appointment.duration} min
                                  </div>
                                </div>
                                
                                {/* Action Buttons - Stack vertically on mobile */}
                                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                  {appointment.status === 'pending' && (
                                    <button
                                      onClick={() => handleDoneClick(appointment.id)}
                                      className="px-2 py-1 sm:px-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs sm:text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm w-full sm:w-auto"
                                    >
                                      Done
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onEdit(appointment.id)}
                                    className="px-2 py-1 sm:px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm w-full sm:w-auto"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(appointment.id)}
                                    disabled={deletingAppointments.has(appointment.id)}
                                    className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm w-full sm:w-auto ${
                                      deletingAppointments.has(appointment.id)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
                                    }`}
                                  >
                                    {deletingAppointments.has(appointment.id) ? (
                                      <div className="flex items-center justify-center space-x-1">
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Deleting...</span>
                                      </div>
                                    ) : (
                                      'Delete'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Today Section */}
                  {completedToday.length > 0 && (
                    <div>
                      <div className={`flex items-center space-x-2 mb-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-sm uppercase tracking-wide">Completed Today</h3>
                        <span className="text-xs text-gray-500">({completedToday.length})</span>
                      </div>
                      <div className="space-y-3">
                        {completedToday.map((appointment) => (
                          <div
                            key={appointment.id}
                            className={`p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                              theme === 'dark' 
                                ? 'bg-gray-800 hover:bg-gray-700' 
                                : 'bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
                            } shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-green-200'}`}
                          >
                            <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                              <div className="flex-1 space-y-2 w-full sm:w-auto">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-6 h-6 text-gray-400" />
                                    <span className="text-2xl font-semibold">{getClientName(appointment.clientId)}</span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                    {appointment.status}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDisplayDate(appointment.date)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="font-semibold text-green-600">${(appointment.price || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                {appointment.notes && (
                                  <div className={`text-sm p-2 rounded-lg ${
                                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
                                  }`}>
                                    {appointment.notes}
                                  </div>
                                )}
                              </div>
                              
                              {/* Mobile-first responsive layout */}
                              <div className="flex flex-col items-end space-y-3 ml-0 sm:ml-4 w-full sm:w-auto">
                                {/* Time Display */}
                                <div className="text-right">
                                  <div className={`text-2xl sm:text-4xl font-bold ${
                                    theme === 'dark' ? 'text-white' : 'text-green-600'
                                  }`}>
                                    {formatTime(appointment.time)}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    {appointment.duration} min
                                  </div>
                                </div>
                                
                                {/* Action Buttons - Stack vertically on mobile */}
                                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                  <button
                                    onClick={() => onEdit(appointment.id)}
                                    className="px-2 py-1 sm:px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm w-full sm:w-auto"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(appointment.id)}
                                    disabled={deletingAppointments.has(appointment.id)}
                                    className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm w-full sm:w-auto ${
                                      deletingAppointments.has(appointment.id)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
                                    }`}
                                  >
                                    {deletingAppointments.has(appointment.id) ? (
                                      <div className="flex items-center justify-center space-x-1">
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Deleting...</span>
                                      </div>
                                    ) : (
                                      'Delete'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular list for other filters
              return filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                    theme === 'dark' 
                      ? 'bg-gray-800 hover:bg-gray-700' 
                      : 'bg-gradient-to-br from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100'
                  } shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 space-y-2 w-full sm:w-auto">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-6 h-6 text-gray-400" />
                          <span className="text-2xl font-semibold">{getClientName(appointment.clientId)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDisplayDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-green-600">${(appointment.price || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className={`text-sm p-2 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile-first responsive layout */}
                    <div className="flex flex-col items-end space-y-3 ml-0 sm:ml-4 w-full sm:w-auto">
                      {/* Time Display */}
                      <div className="text-right">
                        <div className={`text-2xl sm:text-4xl font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-slate-600'
                        }`}>
                          {formatTime(appointment.time)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {appointment.duration} min
                        </div>
                      </div>
                      
                      {/* Action Buttons - Stack vertically on mobile */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleDoneClick(appointment.id)}
                            className="px-2 py-1 sm:px-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs sm:text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm w-full sm:w-auto"
                          >
                            Done
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(appointment.id)}
                          className="px-2 py-1 sm:px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm w-full sm:w-auto"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(appointment.id)}
                          disabled={deletingAppointments.has(appointment.id)}
                          className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm w-full sm:w-auto ${
                            deletingAppointments.has(appointment.id)
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
                          }`}
                        >
                          {deletingAppointments.has(appointment.id) ? (
                            <div className="flex items-center justify-center space-x-1">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Deleting...</span>
                            </div>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            }
          })()
        )}
      </div>

      {/* Price Input Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-xl shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Enter Payment Amount</h2>
              <button
                onClick={handleCloseModal}
                className={`p-1 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  How much did you charge for this haircut?
                </label>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-3xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    $
                  </div>
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-4 text-3xl font-bold text-center rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                    autoFocus
                  />
                </div>
                <div className="text-center text-sm text-gray-500">
                  Enter the amount in dollars (e.g., 25.00)
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6">
                <button
                  onClick={handleCloseModal}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePriceSubmit}
                  disabled={!priceInput || parseFloat(priceInput) < 0}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;