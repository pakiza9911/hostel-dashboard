export type Role = 'super_admin' | 'owner' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  hostelId?: string; // for owners/managers
  permissions?: Permission[]; // for managers
  password?: string; // for user creation
  createdAt: string;
}

export type Permission =
  | 'view_dashboard'
  | 'manage_rooms'
  | 'manage_tenants'
  | 'manage_payments'
  | 'manage_maintenance'
  | 'manage_staff'
  | 'view_analytics';

export interface Hostel {
  id: string;
  name: string;
  ownerId: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  monthlyRevenue: number;
  status: 'active' | 'inactive';
  image?: string;
  createdAt: string;
  facilities: string[];
}

export interface Room {
  id: string;
  hostelId: string;
  number: string;
  floor: number;
  type: 'single' | 'double' | 'triple' | 'quad' | 'dorm';
  capacity: number;
  rentPerBed: number;
  facilities: string[];
  status: 'active' | 'maintenance';
}

export interface Bed {
  id: string;
  roomId: string;
  hostelId: string;
  label: string; // A, B, C
  tenantId?: string;
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance';
}

export interface Tenant {
  id: string;
  hostelId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  idType: 'cnic' | 'passport' | 'driving_license' | 'other';
  idNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  bedId?: string;
  roomId?: string;
  joinDate: string;
  checkoutDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'active' | 'checked_out' | 'pending';
  occupation?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  hostelId: string;
  tenantId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'fine' | 'other';
  method: 'cash' | 'card' | 'upi' | 'bank_transfer';
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  dueDate: string;
  paidDate?: string;
  monthFor: string; // YYYY-MM
  invoiceNumber: string;
  notes?: string;
}

export interface MaintenanceTicket {
  id: string;
  hostelId: string;
  roomId?: string;
  tenantId?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'furniture' | 'cleaning' | 'wifi' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}
