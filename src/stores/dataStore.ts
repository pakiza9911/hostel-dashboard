import { create } from 'zustand';
import type { Hostel, Room, Bed, Tenant, Payment, MaintenanceTicket, User } from '../types';
import {
  hostelsAPI, roomsAPI, bedsAPI, tenantsAPI, paymentsAPI, ticketsAPI, usersAPI,
} from '../lib/api';

interface DataState {
  hostels: Hostel[];
  rooms: Room[];
  beds: Bed[];
  tenants: Tenant[];
  payments: Payment[];
  tickets: MaintenanceTicket[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  selectedHostelId: string | null;
  setSelectedHostelId: (id: string | null) => void;
  fetchAll: () => Promise<void>;
  addHostel: (h: Hostel) => Promise<void>;
  updateHostel: (id: string, patch: Partial<Hostel>) => Promise<void>;
  deleteHostel: (id: string) => Promise<void>;
  addRoom: (r: Room) => Promise<void>;
  updateRoom: (id: string, patch: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addBed: (b: Bed) => Promise<void>;
  updateBed: (id: string, patch: Partial<Bed>) => Promise<void>;
  addTenant: (t: Tenant) => Promise<void>;
  updateTenant: (id: string, patch: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  assignTenantToBed: (tenantId: string, bedId: string) => Promise<void>;
  unassignTenant: (tenantId: string) => Promise<void>;
  addPayment: (p: Payment) => Promise<void>;
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>;
  markPaymentPaid: (id: string, method: Payment['method']) => Promise<void>;
  addTicket: (t: MaintenanceTicket) => Promise<void>;
  updateTicket: (id: string, patch: Partial<MaintenanceTicket>) => Promise<void>;
  addUser: (u: User) => Promise<any>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  hostels: [],
  rooms: [],
  beds: [],
  tenants: [],
  payments: [],
  tickets: [],
  users: [],
  isLoading: false,
  error: null,
  selectedHostelId: null,
  setSelectedHostelId: (id) => set({ selectedHostelId: id }),
  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [hostelsRes, roomsRes, bedsRes, tenantsRes, paymentsRes, ticketsRes, usersRes] = await Promise.all([
        hostelsAPI.getAll(),
        roomsAPI.getAll(),
        bedsAPI.getAll(),
        tenantsAPI.getAll(),
        paymentsAPI.getAll(),
        ticketsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      set({
        hostels: hostelsRes.data,
        rooms: roomsRes.data,
        beds: bedsRes.data,
        tenants: tenantsRes.data,
        payments: paymentsRes.data,
        tickets: ticketsRes.data,
        users: usersRes.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch data', isLoading: false });
    }
  },
  addHostel: async (h) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating hostel with data:', h);
      await hostelsAPI.create(h);
      console.log('Hostel created successfully');
      const res = await hostelsAPI.getAll();
      set({ hostels: res.data, isLoading: false });
    } catch (error: any) {
      console.error('Failed to create hostel:', error.response?.data || error.message);
      set({ error: error.response?.data?.error || 'Failed to create hostel', isLoading: false });
      throw error;
    }
  },
  updateHostel: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await hostelsAPI.update(id, patch);
      const res = await hostelsAPI.getAll();
      set({ hostels: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update hostel', isLoading: false });
    }
  },
  deleteHostel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await hostelsAPI.delete(id);
      const res = await hostelsAPI.getAll();
      set({ hostels: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete hostel', isLoading: false });
    }
  },
  addRoom: async (r) => {
    set({ isLoading: true, error: null });
    try {
      await roomsAPI.create(r);
      const res = await roomsAPI.getAll();
      set({ rooms: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create room', isLoading: false });
    }
  },
  updateRoom: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await roomsAPI.update(id, patch);
      const res = await roomsAPI.getAll();
      set({ rooms: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update room', isLoading: false });
    }
  },
  deleteRoom: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await roomsAPI.delete(id);
      const [roomsRes, bedsRes] = await Promise.all([roomsAPI.getAll(), bedsAPI.getAll()]);
      set({ rooms: roomsRes.data, beds: bedsRes.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete room', isLoading: false });
    }
  },
  addBed: async (b) => {
    set({ isLoading: true, error: null });
    try {
      await bedsAPI.create(b);
      const res = await bedsAPI.getAll();
      set({ beds: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create bed', isLoading: false });
    }
  },
  updateBed: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await bedsAPI.update(id, patch);
      const res = await bedsAPI.getAll();
      set({ beds: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update bed', isLoading: false });
    }
  },
  addTenant: async (t) => {
    set({ isLoading: true, error: null });
    try {
      await tenantsAPI.create(t);
      const res = await tenantsAPI.getAll();
      set({ tenants: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create tenant', isLoading: false });
    }
  },
  updateTenant: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await tenantsAPI.update(id, patch);
      const res = await tenantsAPI.getAll();
      set({ tenants: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update tenant', isLoading: false });
    }
  },
  deleteTenant: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tenantsAPI.delete(id);
      const [tenantsRes, bedsRes] = await Promise.all([tenantsAPI.getAll(), bedsAPI.getAll()]);
      set({ tenants: tenantsRes.data, beds: bedsRes.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete tenant', isLoading: false });
    }
  },
  assignTenantToBed: async (tenantId, bedId) => {
    set({ isLoading: true, error: null });
    try {
      await bedsAPI.update(bedId, { tenantId, status: 'occupied' });
      await tenantsAPI.update(tenantId, { status: 'active' });
      const [tenantsRes, bedsRes] = await Promise.all([tenantsAPI.getAll(), bedsAPI.getAll()]);
      set({ tenants: tenantsRes.data, beds: bedsRes.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to assign tenant', isLoading: false });
    }
  },
  unassignTenant: async (tenantId) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const bed = state.beds.find((b) => b.tenantId === tenantId);
      if (bed) {
        await bedsAPI.update(bed.id, { tenantId: null, status: 'vacant' });
      }
      await tenantsAPI.update(tenantId, { bedId: undefined, roomId: undefined });
      const [tenantsRes, bedsRes] = await Promise.all([tenantsAPI.getAll(), bedsAPI.getAll()]);
      set({ tenants: tenantsRes.data, beds: bedsRes.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to unassign tenant', isLoading: false });
    }
  },
  addPayment: async (p) => {
    set({ isLoading: true, error: null });
    try {
      await paymentsAPI.create(p);
      const res = await paymentsAPI.getAll();
      set({ payments: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create payment', isLoading: false });
    }
  },
  updatePayment: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await paymentsAPI.update(id, patch);
      const res = await paymentsAPI.getAll();
      set({ payments: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update payment', isLoading: false });
    }
  },
  markPaymentPaid: async (id, method) => {
    set({ isLoading: true, error: null });
    try {
      await paymentsAPI.markPaid(id, method);
      const res = await paymentsAPI.getAll();
      set({ payments: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to mark payment as paid', isLoading: false });
    }
  },
  addTicket: async (t) => {
    set({ isLoading: true, error: null });
    try {
      await ticketsAPI.create(t);
      const res = await ticketsAPI.getAll();
      set({ tickets: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create ticket', isLoading: false });
    }
  },
  updateTicket: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await ticketsAPI.update(id, patch);
      const res = await ticketsAPI.getAll();
      set({ tickets: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update ticket', isLoading: false });
    }
  },
  addUser: async (u) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating user with data:', u);
      const res = await usersAPI.create(u);
      const usersRes = await usersAPI.getAll();
      set({ users: usersRes.data, isLoading: false });
      return res.data;
    } catch (error: any) {
      console.error('Failed to create user:', error.response?.data || error.message);
      set({ error: error.response?.data?.error || 'Failed to create user', isLoading: false });
      throw error;
    }
  },
  updateUser: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      await usersAPI.update(id, patch);
      const res = await usersAPI.getAll();
      set({ users: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update user', isLoading: false });
    }
  },
  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await usersAPI.delete(id);
      const res = await usersAPI.getAll();
      set({ users: res.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete user', isLoading: false });
    }
  },
}));
