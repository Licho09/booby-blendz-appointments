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

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await appointmentsAPI.getAll();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      console.error('Failed to load appointments:', err);
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