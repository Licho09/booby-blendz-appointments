import { useState, useEffect, useRef } from 'react';
import { appointmentsAPI } from '../services/api';
import type { Appointment } from '../types';

// Cache for appointments data
const appointmentsCache = {
  data: null as Appointment[] | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef(0);

  // Load appointments from API on mount
  useEffect(() => {
    // Clear cache on mount to ensure fresh data
    appointmentsCache.data = null;
    appointmentsCache.timestamp = 0;
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

  const loadAppointments = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Check cache first (unless force refresh)
      if (!forceRefresh && appointmentsCache.data && (now - appointmentsCache.timestamp) < appointmentsCache.ttl) {
        setAppointments(appointmentsCache.data);
        setIsLoading(false);
        return;
      }

      // Prevent multiple simultaneous requests
      if (now - lastFetchTime.current < 1000) { // 1 second throttle
        return;
      }
      lastFetchTime.current = now;

      setIsLoading(true);
      setError(null);
      
      const data = await appointmentsAPI.getAll();
      
      // Update cache
      appointmentsCache.data = data;
      appointmentsCache.timestamp = now;
      
      setAppointments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load appointments';
      setError(errorMessage);
      console.error('Failed to load appointments:', err);
      
      // If it's a network error, show a more user-friendly message
      if (errorMessage.includes('fetch') || errorMessage.includes('AbortError')) {
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
      
      // Clear cache to ensure fresh data
      appointmentsCache.data = null;
      appointmentsCache.timestamp = 0;
      
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
      
      // Clear cache to ensure fresh data
      appointmentsCache.data = null;
      appointmentsCache.timestamp = 0;
      
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
      
      // Clear cache to ensure fresh data
      appointmentsCache.data = null;
      appointmentsCache.timestamp = 0;
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshAppointments = () => {
    loadAppointments(true); // Force refresh, bypass cache
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