import axios from 'axios';
import { auth } from './firebase';
import type { Driver, Booking, Customer, Stats, RevenuePoint, TripPoint } from '../types';

const rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

// Attach the Firebase ID token to every request automatically
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Stats ─────────────────────────────────────────────────────────────────
export const fetchStats = async (): Promise<Stats> => {
  const { data } = await api.get<Stats>('/stats');
  return data;
};

// ── Drivers ───────────────────────────────────────────────────────────────
export const fetchDrivers = async (status?: string): Promise<Driver[]> => {
  const params = status && status !== 'all' ? { status } : {};
  const { data } = await api.get<{ drivers: Driver[] }>('/drivers', { params });
  return data.drivers;
};

export const fetchDriver = async (uid: string): Promise<Driver> => {
  const { data } = await api.get<Driver>(`/drivers/${uid}`);
  return data;
};

export const updateDriverVerification = async (
  uid: string,
  status: string,
  notes?: string
): Promise<void> => {
  await api.patch(`/drivers/${uid}/verify`, { status, notes });
};

export const toggleDriverActive = async (uid: string): Promise<{ isActive: boolean }> => {
  const { data } = await api.patch<{ isActive: boolean }>(`/drivers/${uid}/toggle`);
  return data;
};

// ── Bookings ──────────────────────────────────────────────────────────────
export const fetchBookings = async (filters?: {
  status?: string;
  bookingType?: string;
}): Promise<Booking[]> => {
  const params: Record<string, string> = {};
  if (filters?.status && filters.status !== 'all') params.status = filters.status;
  if (filters?.bookingType && filters.bookingType !== 'all') params.bookingType = filters.bookingType;
  const { data } = await api.get<{ bookings: Booking[] }>('/bookings', { params });
  return data.bookings;
};

export const fetchBooking = async (id: string): Promise<Booking> => {
  const { data } = await api.get<Booking>(`/bookings/${id}`);
  return data;
};

export const assignDriver = async (bookingId: string, driverId: string): Promise<void> => {
  await api.patch(`/bookings/${bookingId}/assign`, { driverId });
};

export const updateBookingStatus = async (id: string, status: string): Promise<void> => {
  await api.patch(`/bookings/${id}/status`, { status });
};

// ── Customers ─────────────────────────────────────────────────────────────
export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data } = await api.get<{ users: Customer[] }>('/users');
  return data.users;
};

// ── Reports ───────────────────────────────────────────────────────────────
export const fetchRevenueReport = async (): Promise<RevenuePoint[]> => {
  const { data } = await api.get<{ revenue: RevenuePoint[] }>('/reports/revenue');
  return data.revenue;
};

export const fetchTripsReport = async (): Promise<TripPoint[]> => {
  const { data } = await api.get<{ trips: TripPoint[] }>('/reports/trips');
  return data.trips;
};

export default api;
