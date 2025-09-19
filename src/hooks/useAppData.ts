import { useState, useEffect } from 'react';
import { useAppointments } from './useAppointments';
import { useClients } from './useClients';

export function useAppData() {
  const appointments = useAppointments();
  const clients = useClients();
  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [hasDataLoss, setHasDataLoss] = useState(false);

  // Check if we have data loss (appointments but no clients, or vice versa)
  useEffect(() => {
    const hasAppointments = appointments.appointments.length > 0;
    const hasClients = clients.clients.length > 0;
    
    // If we have appointments but no clients, or clients but no appointments, we might have data loss
    if (hasAppointments && !hasClients) {
      setHasDataLoss(true);
      console.log('Data loss detected: appointments exist but no clients');
      // Try to reload clients
      clients.refreshClients();
    } else if (hasClients && !hasAppointments) {
      setHasDataLoss(true);
      console.log('Data loss detected: clients exist but no appointments');
      // Try to reload appointments
      appointments.refreshAppointments();
    } else {
      setHasDataLoss(false);
    }
  }, [appointments.appointments.length, clients.clients.length]);

  // Handle visibility change for mobile app resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // If app becomes visible and we have data loss, try to reload both
        if (hasDataLoss) {
          console.log('App became visible with data loss, reloading both appointments and clients');
          appointments.refreshAppointments();
          clients.refreshClients();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasDataLoss]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      if (hasDataLoss || appointments.error || clients.error) {
        console.log('Network back online, reloading data');
        appointments.refreshAppointments();
        clients.refreshClients();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasDataLoss, appointments.error, clients.error]);

  // Mark initial load as complete when both are loaded
  useEffect(() => {
    if (!appointments.isLoading && !clients.isLoading && !appointments.error && !clients.error) {
      setIsInitialLoadComplete(true);
    }
  }, [appointments.isLoading, clients.isLoading, appointments.error, clients.error]);

  const refreshAll = () => {
    appointments.refreshAppointments();
    clients.refreshClients();
  };

  return {
    appointments: appointments.appointments,
    clients: clients.clients,
    isLoading: appointments.isLoading || clients.isLoading,
    error: appointments.error || clients.error,
    isInitialLoadComplete,
    hasDataLoss,
    refreshAll,
    // Individual hooks for specific operations
    addAppointment: appointments.addAppointment,
    updateAppointment: appointments.updateAppointment,
    deleteAppointment: appointments.deleteAppointment,
    addClient: clients.addClient,
    updateClient: clients.updateClient,
    deleteClient: clients.deleteClient,
  };
}

