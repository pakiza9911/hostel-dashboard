import { useMemo } from 'react';
import { useAuth } from '../stores/authStore';
import { useData } from '../stores/dataStore';

/** Returns data scoped to the user's hostel; super_admin can switch via selectedHostelId. */
export function useScopedData() {
  const { user } = useAuth();
  const data = useData();
  const isSuperAdmin = user?.role === 'super_admin';

  return useMemo(() => {
    let hostelIds: string[] = [];
    if (isSuperAdmin) {
      hostelIds = data.selectedHostelId
        ? [data.selectedHostelId]
        : data.hostels.map((h) => h.id);
    } else if (user?.hostelId) {
      hostelIds = [user.hostelId];
    } else if (user?.role === 'owner') {
      // Fallback: find hostel by ownerId if hostelId is null
      const ownedHostel = data.hostels.find((h) => h.ownerId === user.id);
      if (ownedHostel) {
        hostelIds = [ownedHostel.id];
        console.log('Found hostel by ownerId:', ownedHostel.id);
      } else {
        console.warn('User has no hostelId and no hostel found by ownerId:', user);
      }
    } else {
      console.warn('User has no hostelId:', user);
    }
    const set = new Set(hostelIds);
    const result = {
      hostelIds,
      hostels: data.hostels.filter((h) => set.has(h.id)),
      rooms: data.rooms.filter((r) => set.has(r.hostelId)),
      beds: data.beds.filter((b) => set.has(b.hostelId)),
      tenants: data.tenants.filter((t) => set.has(t.hostelId)),
      payments: data.payments.filter((p) => set.has(p.hostelId)),
      tickets: data.tickets.filter((t) => set.has(t.hostelId)),
      isSuperAdmin,
      currentHostel: hostelIds.length === 1 ? data.hostels.find((h) => h.id === hostelIds[0]) : null,
    };
    console.log('Scoped data:', { userRole: user?.role, hostelIds, hostelsCount: result.hostels.length });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, data.selectedHostelId, data.hostels, data.rooms, data.beds, data.tenants, data.payments, data.tickets]);
}
