export type View = 'appointments' | 'earnings' | 'dashboard';

export interface Appointment {
  id: string;
  clientId: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  notes?: string;
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface EarningsData {
  date: string;
  amount: number;
  appointments: number;
}

export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export interface AppointmentStats {
  today: number;
  scheduled: number;
  total: number;
  earnings: number;
}