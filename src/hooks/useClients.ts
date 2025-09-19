import { useState, useEffect } from 'react';
import { clientsAPI } from '../services/api';
import type { Client } from '../types';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients from API on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Add visibility change listener for mobile app resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && clients.length === 0) {
        // If app becomes visible and no clients loaded, try to reload
        loadClients();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [clients.length]);

  // Add network status listener
  useEffect(() => {
    const handleOnline = () => {
      if (clients.length === 0 || error) {
        // If we're offline or have an error, try to reload when back online
        loadClients();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [clients.length, error]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add a minimum loading time to prevent flickering on fast connections
      const [data] = await Promise.all([
        clientsAPI.getAll(),
        new Promise(resolve => setTimeout(resolve, 300)) // Minimum 300ms loading
      ]);
      
      setClients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMessage);
      console.error('Failed to load clients:', err);
      
      // If it's a network error, show a more user-friendly message
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setError('Unable to connect to the server. Please check your internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      console.log('useClients: Creating client with data:', clientData);
      const newClient = await clientsAPI.create(clientData);
      console.log('useClients: Client created successfully:', newClient);
      setClients(prev => [...prev, newClient]);
      return { success: true, client: newClient };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
      console.error('useClients: Client creation failed:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateClient = async (id: string, clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const updatedClient = await clientsAPI.update(id, clientData);
      setClients(prev =>
        prev.map(client =>
          client.id === id
            ? { ...updatedClient, createdAt: client.createdAt }
            : client
        )
      );
      return { success: true, client: updatedClient };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setError(null);
      await clientsAPI.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshClients = () => {
    loadClients();
  };

  return {
    clients,
    isLoading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refreshClients,
  };
}