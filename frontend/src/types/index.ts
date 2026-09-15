// Shared TypeScript types matching the Firestore schema

export interface Driver {
  uid: string;
  name: string;
  phone: string;
  email: string;
  age: number | null;
  gender: string;
  dob: string | null;
  drivingLicense: string;
  licenseIssueDate: string | null;
  licenseExpiryDate: string | null;
  panNumber: string;
  aadhaarNumber: string;
  fatherName: string;
  referenceName: string;
  referencePhone: string;
  emergencyName: string;
  emergencyPhone: string;
  documents: {
    aadhaarUrl?: string;
    panUrl?: string;
    dlUrl?: string;
  };
  onboardingCompleted: boolean;
  verificationStatus: 'pending' | 'background_check' | 'police_verification' | 'registration_received' | 'verified' | 'rejected';
  verificationNotes: string;
  isActive: boolean;
  createdAt: string | null;
}

export interface Booking {
  id: string;
  userId: string;
  driverId: string | null;
  status: 'pending' | 'searching' | 'scheduled' | 'accepted' | 'completed' | 'cancelled' | 'rejected';
  name: string;
  phone: string;
  carType: string;
  gearType: string;
  baseCharge: number;
  perKmRate?: number;
  bookingType: 'local' | 'outstation' | 'outstation-drop';
  // Local fields
  tripType: string | null;
  packageHours: number | null;
  pickupLocation: string | null;
  visitingLocation: string | null;
  bookingDateTime: string | null;
  // Outstation fields
  pickup: { description: string; lat: number; lng: number } | null;
  dropoff: { description: string; lat: number; lng: number } | null;
  startDateTime: string | null;
  endDate: string | null;
  // Meta
  createdAt: string | null;
  declinedBy: string[];
}

export interface Customer {
  uid: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string | null;
}

export interface Stats {
  totalDrivers: number;
  verifiedDrivers: number;
  totalCustomers: number;
  totalAdmins: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface RevenuePoint {
  month: string; // "2024-01"
  total: number;
}

export interface TripPoint {
  driverId: string;
  driverName: string;
  trips: number;
}
