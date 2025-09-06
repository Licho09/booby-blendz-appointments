import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, MessageCircle } from 'lucide-react';
import type { Appointment, Client } from '../types';
import { smsService } from '../services/smsService';

interface AppointmentFormProps {
  appointment?: Appointment;
  clients: Client[];
  onSubmit: (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  clients,
  onSubmit,
  onClose,
  theme
}) => {
  const [formData, setFormData] = useState({
    clientName: appointment?.clientId ? clients.find(c => c.id === appointment.clientId)?.name || '' : '',
    title: appointment?.title || '',
    date: appointment?.date || (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    time: appointment?.time || '09:00',
    duration: appointment?.duration || 60,
    price: appointment?.price || 0,
    notes: appointment?.notes || '',
    status: appointment?.status || 'pending' as const
  });

  const [sendSMS, setSendSMS] = useState(true);
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [smsMessage, setSmsMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.date || !formData.time) {
      return;
    }
    
    // Debug logging for form submission
    console.log('Form submitted with date:', formData.date);
    
    // Find existing client or create a new one
    let clientId = '';
    const existingClient = clients.find(client => 
      client.name.toLowerCase() === formData.clientName.toLowerCase()
    );
    
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create a new client ID for the new client name
      clientId = crypto.randomUUID();
    }
    
    const appointmentData = {
      ...formData,
      clientId,
      title: formData.clientName // Use client name as title
    };
    
    setIsSubmitting(true);
    onSubmit(appointmentData);
    
    // Send SMS notification if enabled
    if (sendSMS) {
      setSmsStatus('sending');
      try {
        const smsResult = await smsService.sendAppointmentSMS({
          clientName: formData.clientName,
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          price: formData.price,
          notes: formData.notes,
          status: formData.status
        });
        
        if (smsResult.success) {
          setSmsStatus('success');
          setSmsMessage('SMS confirmation sent successfully! 📱');
        } else {
          setSmsStatus('error');
          setSmsMessage(`SMS failed: ${smsResult.error}`);
        }
      } catch (error) {
        setSmsStatus('error');
        setSmsMessage('Failed to send SMS notification');
        console.error('SMS error:', error);
      }
    }
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Debug logging for date changes
    if (name === 'date') {
      console.log('Date input changed:', value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className={`w-full max-w-md rounded-xl shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Client Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              <User className="w-4 h-4 inline mr-2" />
              Client Name
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Enter client name"
              required
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            />
          </div>





          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                <Clock className="w-4 h-4 inline mr-2" />
                Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="timeHour"
                  value={formData.time.split(':')[0]}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const minute = formData.time.split(':')[1];
                    setFormData(prev => ({
                      ...prev,
                      time: `${hour}:${minute}`
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                    </option>
                  ))}
                </select>
                <select
                  name="timeMinute"
                  value={formData.time.split(':')[1]}
                  onChange={(e) => {
                    const hour = formData.time.split(':')[0];
                    const minute = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      time: `${hour}:${minute}`
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                >
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
              </div>
            </div>
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Duration (minutes)</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            >
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes or special requests..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            />
          </div>

          {/* SMS Notification Toggle */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendSMS"
                checked={sendSMS}
                onChange={(e) => setSendSMS(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="sendSMS" className="flex items-center space-x-2 text-sm font-medium">
                <MessageCircle className="w-4 h-4" />
                <span>Send notification to barber</span>
              </label>
            </div>
            
            {/* SMS Status */}
            {smsStatus !== 'idle' && (
              <div className={`p-2 rounded-lg text-sm ${
                smsStatus === 'sending' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : smsStatus === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {smsStatus === 'sending' && '📧 Sending Email-to-SMS...'}
                {smsStatus === 'success' && smsMessage}
                {smsStatus === 'error' && smsMessage}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                `${appointment ? 'Update' : 'Create'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;