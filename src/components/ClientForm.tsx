import React, { useState } from 'react';
import { X, User, Phone, Mail, FileText } from 'lucide-react';
import type { Client } from '../types';

interface ClientFormProps {
  client?: Client;
  onSubmit: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSubmit, onClose, theme }) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    notes: client?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-xl shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {client ? 'Edit Client' : 'New Client'}
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
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              <User className="w-4 h-4 inline mr-2" />
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Client's full name"
              required
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              required
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@example.com"
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Hair type, preferred styles, allergies, etc..."
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              {client ? 'Update' : 'Create'} Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;