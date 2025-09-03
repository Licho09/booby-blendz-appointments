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

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await clientsAPI.getAll();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const newClient = await clientsAPI.create(clientData);
      setClients(prev => [...prev, newClient]);
      return { success: true, client: newClient };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
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