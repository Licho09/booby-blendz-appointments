import React, { useState } from 'react';
import { Edit3, Trash2, Search, User, Phone, Mail } from 'lucide-react';
import type { Client } from '../types';

interface ClientListProps {
  clients: Client[];
  onEdit: (clientId: string) => void;
  onDelete: (clientId: string) => void;
  theme: 'light' | 'dark';
}

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="text-sm text-gray-500">
          {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500' 
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-200`}
        />
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className={`text-center py-12 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No clients found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className={`p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-50'
              } shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Added {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a 
                        href={`tel:${client.phone}`}
                        className="text-blue-500 hover:underline"
                      >
                        {client.phone}
                      </a>
                    </div>
                    
                    {client.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a 
                          href={`mailto:${client.email}`}
                          className="text-blue-500 hover:underline"
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {client.notes && (
                    <div className={`text-sm p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {client.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(client.id)}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400' 
                        : 'hover:bg-gray-100 text-gray-400 hover:text-blue-500'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(client.id)}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                        : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientList;