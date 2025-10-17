import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../services/api';
import type { Appointment } from '../types';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load appointments from API on mount
  useEffect(() => {
    loadAppointments();
  }, []);

  // Add visibility change listener for mobile app resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && appointments.length === 0) {
        // If app becomes visible and no appointments loaded, try to reload
        loadAppointments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [appointments.length]);

  // Add network status listener
  useEffect(() => {
    const handleOnline = () => {
      if (appointments.length === 0 || error) {
        // If we're offline or have an error, try to reload when back online
        loadAppointments();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [appointments.length, error]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add a minimum loading time to prevent flickering on fast connections
      const [data] = await Promise.all([
        appointmentsAPI.getAll(),
        new Promise(resolve => setTimeout(resolve, 300)) // Minimum 300ms loading
      ]);
      
      setAppointments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load appointments';
      setError(errorMessage);
      console.error('Failed to load appointments:', err);
      
      // If it's a network error, show a more user-friendly message
      if (errorMessage.includes('fetch') || errorMessage.includes('AbortError') || errorMessage.includes('timed out') || errorMessage.includes('Network')) {
        setError('Network connection issue. Please check your internet and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const newAppointment = await appointmentsAPI.create(appointmentData);
      setAppointments(prev => [...prev, newAppointment]);
      return { success: true, appointment: newAppointment };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create appointment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateAppointment = async (id: string, appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const updatedAppointment = await appointmentsAPI.update(id, appointmentData);
      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === id
            ? { ...updatedAppointment, createdAt: appointment.createdAt }
            : appointment
        )
      );
      return { success: true, appointment: updatedAppointment };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      setError(null);
      await appointmentsAPI.delete(id);
      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshAppointments = () => {
    loadAppointments();
  };

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refreshAppointments,
  };
}