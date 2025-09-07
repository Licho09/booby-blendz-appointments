import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { Appointment, TimeFilter } from '../types';

interface EarningsViewProps {
  appointments: Appointment[];
  onBack: () => void;
  theme: 'light' | 'dark';
}

const EarningsView: React.FC<EarningsViewProps> = ({ appointments, theme }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [currentOffset, setCurrentOffset] = useState(0); // 0 = current, -1 = previous, 1 = next

  const chartData = useMemo(() => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const now = new Date();
    
    // Filter appointments based on time filter and current offset
    let filteredAppointments = completedAppointments;
    
    switch (timeFilter) {
      case 'today':
        // Navigate by days
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + currentOffset);
        const targetDateUTC = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
        filteredAppointments = completedAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          const aptDateUTC = new Date(aptDate.getUTCFullYear(), aptDate.getUTCMonth(), aptDate.getUTCDate());
          return aptDateUTC.getTime() === targetDateUTC.getTime();
        });
        break;
      case 'week':
        // Navigate by weeks
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (currentOffset * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        filteredAppointments = completedAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= weekStart && aptDate <= weekEnd;
        });
        break;
      case 'month':
        // Navigate by months
        const monthStart = new Date(now.getFullYear(), now.getMonth() + currentOffset, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + currentOffset + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        filteredAppointments = completedAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= monthStart && aptDate <= monthEnd;
        });
        break;
      case 'all':
        // Use all completed appointments
        break;
    }

    const dataMap = new Map();

    // Initialize all days of the week for week view
    if (timeFilter === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => {
        dataMap.set(day, { name: day, earnings: 0, appointments: 0 });
      });
    }

    // Initialize all days of the target month for month view
    if (timeFilter === 'month') {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + currentOffset, 1);
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dataMap.set(day.toString(), { name: day.toString(), earnings: 0, appointments: 0 });
      }
    }

    // Initialize 12 months of current year for all time view
    if (timeFilter === 'all') {
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(now.getFullYear(), month, 1);
        const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        dataMap.set(monthKey, { name: monthKey, earnings: 0, appointments: 0 });
      }
    }

    filteredAppointments.forEach(apt => {
      const date = new Date(apt.date);
      let key: string;

      if (timeFilter === 'today') {
        key = 'Today';
      } else if (timeFilter === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        // Use UTC day since dates are stored in UTC format
        key = days[date.getUTCDay()];
      } else if (timeFilter === 'month') {
        // Use UTC date since dates are stored in UTC format
        key = date.getUTCDate().toString();
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { name: key, earnings: 0, appointments: 0 });
      }
      
      const existing = dataMap.get(key);
      existing.earnings += apt.price || 0;
      existing.appointments += 1;
    });

    return Array.from(dataMap.values()).sort((a, b) => {
      if (timeFilter === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.indexOf(a.name) - days.indexOf(b.name);
      } else if (timeFilter === 'month') {
        return parseInt(a.name) - parseInt(b.name);
      } else if (timeFilter === 'all') {
        // Sort months chronologically
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [appointments, timeFilter, currentOffset]);

  // Calculate total earnings from chart data (sum of all bars)
  const chartTotalEarnings = useMemo(() => {
    return chartData.reduce((sum, bar) => sum + bar.earnings, 0);
  }, [chartData]);

  // Calculate other stats from chart data
  const totalAppointments = useMemo(() => {
    return chartData.reduce((sum, bar) => sum + bar.appointments, 0);
  }, [chartData]);

  const averagePerAppointment = useMemo(() => {
    return totalAppointments > 0 ? chartTotalEarnings / totalAppointments : 0;
  }, [chartTotalEarnings, totalAppointments]);

  const lineChartData = useMemo(() => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const monthlyData = new Map();

    completedAppointments.forEach(apt => {
      const date = new Date(apt.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { month: key, earnings: 0, appointments: 0 });
      }
      
      const existing = monthlyData.get(key);
      existing.earnings += apt.price || 0;
      existing.appointments += 1;
    });

    return Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }));
  }, [appointments]);

  const timeFilters = [
    { key: 'today' as TimeFilter, label: 'Today' },
    { key: 'week' as TimeFilter, label: 'This Week' },
    { key: 'month' as TimeFilter, label: 'This Month' },
    { key: 'all' as TimeFilter, label: 'All Time' }
  ];

  // Navigation functions
  const handlePrevious = () => {
    setCurrentOffset(prev => prev - 1);
  };

  const handleNext = () => {
    // Only allow going forward if we're in the past (negative offset)
    if (currentOffset < 0) {
      setCurrentOffset(prev => prev + 1);
    }
  };

  const handleTimeFilterChange = (newFilter: TimeFilter) => {
    setTimeFilter(newFilter);
    setCurrentOffset(0); // Reset to current period when changing filter
  };

  // Get current period label
  const getCurrentPeriodLabel = () => {
    const now = new Date();
    
    switch (timeFilter) {
      case 'today':
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + currentOffset);
        if (currentOffset === 0) return 'Today';
        if (currentOffset === -1) return 'Yesterday';
        if (currentOffset === 1) return 'Tomorrow';
        return targetDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (currentOffset * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (currentOffset === 0) return 'This Week';
        if (currentOffset === -1) return 'Last Week';
        if (currentOffset === 1) return 'Next Week';
        
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      
      case 'month':
        const targetMonth = new Date(now.getFullYear(), now.getMonth() + currentOffset, 1);
        if (currentOffset === 0) return 'This Month';
        if (currentOffset === -1) return 'Last Month';
        if (currentOffset === 1) return 'Next Month';
        
        return targetMonth.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      
      default:
        return 'All Time';
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="p-4 space-y-6">
        {/* Title */}
        <h1 className="text-2xl font-bold flex items-center mb-6">
          <DollarSign className="w-5 h-5 mr-2 text-green-500" />
          Earnings Overview
        </h1>
        
        {/* Desktop: Time Filter Buttons (top) */}
        <div className="hidden sm:flex space-x-2 overflow-x-auto mb-6">
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleTimeFilterChange(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                timeFilter === filter.key
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className={`p-2 sm:p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className={`text-xs sm:text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-green-600'
                }`}>
                  Total Earnings
                </p>
                <p className="text-2xl sm:text-2xl font-bold text-green-500 mt-1">
                  ${chartTotalEarnings}
                </p>
              </div>
              <DollarSign className="hidden sm:block w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-2 sm:p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className={`text-xs sm:text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-blue-600'
                }`}>
                  Appointments
                </p>
                <p className="text-2xl sm:text-2xl font-bold text-blue-500 mt-1">
                  {totalAppointments}
                </p>
              </div>
              <Calendar className="hidden sm:block w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-2 sm:p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className={`text-xs sm:text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-orange-600'
                }`}>
                  Average per Appointment
                </p>
                <p className="text-2xl sm:text-2xl font-bold text-orange-500">
                  ${averagePerAppointment.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="hidden sm:block w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Mobile: Time Filter Buttons (above chart) */}
        <div className="flex sm:hidden space-x-2 overflow-x-auto mb-4">
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleTimeFilterChange(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                timeFilter === filter.key
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Navigation Controls (only show for today, week, month) */}
        {timeFilter !== 'all' && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevious}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            <div className="text-center">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {getCurrentPeriodLabel()}
              </h3>
              {currentOffset !== 0 && (
                <button
                  onClick={() => setCurrentOffset(0)}
                  className={`text-sm ${
                    theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  Back to Current
                </button>
              )}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentOffset >= 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentOffset >= 0
                  ? theme === 'dark'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bar Chart */}
        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Earnings by {timeFilter === 'today' ? 'Day' : timeFilter === 'week' ? 'Day' : timeFilter === 'month' ? 'Day' : 'Month'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="name" 
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                  formatter={(value, name) => [
                    name === 'earnings' ? `$${value}` : value,
                    name === 'earnings' ? 'Earnings' : 'Appointments'
                  ]}
                />
                                 <Bar 
                   dataKey="earnings" 
                   fill="#3b82f6" 
                   radius={[4, 4, 0, 0]}
                   barSize={timeFilter === 'today' ? 40 : 60}
                 />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Growth Over Time */}
        {lineChartData.length > 1 && (
          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Income Growth Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="month" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#ffffff' : '#000000'
                    }}
                    formatter={(value, name) => [
                      name === 'earnings' ? `$${value}` : value,
                      name === 'earnings' ? 'Earnings' : 'Appointments'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsView;