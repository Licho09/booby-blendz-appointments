import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, BarChart3, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { Appointment, TimeFilter } from '../types';

interface EarningsViewProps {
  appointments: Appointment[];
  onBack: () => void;
  theme: 'light' | 'dark';
}

const EarningsView: React.FC<EarningsViewProps> = ({ appointments, onBack, theme }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  const chartData = useMemo(() => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const now = new Date();
    const today = now.toDateString();
    
    // Filter appointments based on time filter
    let filteredAppointments = completedAppointments;
    
    switch (timeFilter) {
      case 'today':
        // Use UTC date comparison to avoid timezone issues
        const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        filteredAppointments = completedAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          const aptDateUTC = new Date(aptDate.getUTCFullYear(), aptDate.getUTCMonth(), aptDate.getUTCDate());
          return aptDateUTC.getTime() === todayUTC.getTime();
        });
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filteredAppointments = completedAppointments.filter(apt => 
          new Date(apt.date) >= weekStart
        );
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredAppointments = completedAppointments.filter(apt => 
          new Date(apt.date) >= monthStart
        );
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

    // Initialize all days of the current month for month view
    if (timeFilter === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
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
  }, [appointments, timeFilter]);

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
              onClick={() => setTimeFilter(filter.key)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-green-600'
                }`}>
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-green-500">
                  ${chartTotalEarnings}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-blue-600'
                }`}>
                  Appointments
                </p>
                <p className="text-2xl font-bold text-blue-500">
                  {totalAppointments}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-orange-600'
                }`}>
                  Average per Appointment
                </p>
                <p className="text-2xl font-bold text-orange-500">
                  ${averagePerAppointment.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Mobile: Time Filter Buttons (above chart) */}
        <div className="flex sm:hidden space-x-2 overflow-x-auto mb-4">
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
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

        {/* Bar Chart */}
        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Earnings by {timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'Day' : timeFilter === 'month' ? 'Day' : 'Month'}
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