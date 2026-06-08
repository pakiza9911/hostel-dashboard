import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Users,
  BedDouble,
  Banknote,
  MoreVertical,
  Building2,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { useData } from "../stores/dataStore";
import { useAuth } from "../stores/authStore";
import type { Hostel, User } from "../types";

export function Hostels() {
  const { user } = useAuth();
  const {
    fetchAll,
    isLoading: dataLoading,
    hostels,
    users,
    addHostel,
    addUser,
    updateUser,
    updateHostel,
    deleteHostel,
  } = useData();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hostel | null>(null);
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading hostels...</div>
      </div>
    );
  }

  const startNew = () => {
    setEditing(null);
    setForm({
      name: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
    });
    setOpen(true);
  };
  const startEdit = (h: Hostel) => {
    const owner = users.find((u) => u.id === h.ownerId);
    setEditing(h);
    setForm({
      name: h.name,
      city: h.city,
      address: h.address,
      phone: h.phone,
      email: h.email,
      ownerName: owner?.name ?? "",
      ownerEmail: owner?.email ?? "",
      ownerPassword: "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name || !form.city) return;
    if (editing) {
      updateHostel(editing.id, {
        name: form.name,
        city: form.city,
        address: form.address,
        phone: form.phone,
        email: form.email,
      });
    } else {
      if (!form.ownerEmail || !form.ownerPassword) {
        alert("Owner email and password are required");
        return;
      }
      const hostelId = `h_${Date.now()}`;

      // Create user first (without hostelId initially)
      const owner: User = {
        id: "", // Will be set by backend
        name: form.ownerName || `${form.name} Owner`,
        email:
          form.ownerEmail ||
          `owner@${form.name.toLowerCase().replace(/\s+/g, "")}.com`,
        role: "owner",
        hostelId: null as any, // Will be set after hostel creation
        createdAt: new Date().toISOString(),
      };

      try {
        console.log("Creating user first...");
        const createdUser = await addUser({
          ...owner,
          password: form.ownerPassword,
        });
        const ownerId = createdUser.id;
        console.log(
          "User created successfully with ID:",
          ownerId,
          "now creating hostel",
        );

        // Now create hostel with the user's ID
        const hostel: Hostel = {
          id: hostelId,
          name: form.name,
          ownerId,
          address: form.address,
          city: form.city,
          phone: form.phone,
          email: form.email,
          totalRooms: 0,
          totalBeds: 0,
          occupiedBeds: 0,
          monthlyRevenue: 0,
          status: "active",
          createdAt: new Date().toISOString(),
          facilities: [],
        };
        await addHostel(hostel);
        console.log(
          "Hostel created successfully, now updating user with hostelId",
        );

        // Update user with hostelId
        try {
          await updateUser(ownerId, { hostelId });
          console.log("User updated with hostelId");
        } catch (updateError) {
          console.error("Failed to update user with hostelId:", updateError);
          // Non-fatal error - user and hostel exist, just not linked
          console.warn(
            "User and hostel created but not linked. User can still login.",
          );
        }
      } catch (error: any) {
        console.error("Failed to create hostel and owner:", error);
        const errorMessage = error.response?.data?.error || error.message;
        if (
          errorMessage.includes("Duplicate entry") ||
          errorMessage.includes("duplicate")
        ) {
          alert(
            "A user with this email already exists. Please use a different email or select an existing owner.",
          );
        } else {
          alert(
            `Failed to create hostel and owner: ${errorMessage}. Please try again.`,
          );
        }
        return;
      }
    }
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Hostels"
        subtitle={`Managing ${hostels.length} hostel${hostels.length !== 1 ? "s" : ""} across all locations`}
        actions={
          <button onClick={startNew} className="btn-primary">
            <Plus size={16} /> New Hostel
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hostels.map((h, i) => {
          const owner = users.find((u) => u.id === h.ownerId);
          const occupancy = h.totalBeds
            ? Math.round((h.occupiedBeds / h.totalBeds) * 100)
            : 0;
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="card overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="h-32 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-white/10" />
                <div className="relative h-full p-4 flex flex-col justify-between text-white">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${h.name}? This cannot be undone.`))
                          deleteHostel(h.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight">
                      {h.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                      <MapPin size={11} /> {h.city}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-blue">{occupancy}% occupied</span>
                  <span className="text-xs text-ink-500">
                    Owner: {owner?.name ?? "—"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-ink-50">
                    <BedDouble size={14} className="mx-auto text-ink-500" />
                    <div className="text-sm font-semibold text-ink-900 mt-1">
                      {h.totalBeds}
                    </div>
                    <div className="text-[10px] text-ink-500">Beds</div>
                  </div>
                  <div className="p-2 rounded-lg bg-ink-50">
                    <Users size={14} className="mx-auto text-ink-500" />
                    <div className="text-sm font-semibold text-ink-900 mt-1">
                      {h.occupiedBeds}
                    </div>
                    <div className="text-[10px] text-ink-500">Tenants</div>
                  </div>
                  <div className="p-2 rounded-lg bg-ink-50">
                    <Banknote size={14} className="mx-auto text-ink-500" />
                    <div className="text-sm font-semibold text-ink-900 mt-1">
                      {(h.monthlyRevenue / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[10px] text-ink-500">/month</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex gap-2">
                  <button
                    onClick={() => startEdit(h)}
                    className="btn-secondary flex-1 text-xs py-2"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Hostel" : "Add New Hostel"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={submit} className="btn-primary">
              {editing ? "Save Changes" : "Create Hostel"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Hostel Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">City *</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          {!editing && (
            <>
              <div className="md:col-span-2 mt-2 pt-4 border-t border-ink-100">
                <div className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                  Owner Account
                </div>
              </div>
              <div>
                <label className="label">Owner Name</label>
                <input
                  className="input"
                  value={form.ownerName}
                  onChange={(e) =>
                    setForm({ ...form, ownerName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Owner Email</label>
                <input
                  className="input"
                  value={form.ownerEmail}
                  onChange={(e) =>
                    setForm({ ...form, ownerEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Owner Password *</label>
                <input
                  type="password"
                  className="input"
                  value={form.ownerPassword}
                  onChange={(e) =>
                    setForm({ ...form, ownerPassword: e.target.value })
                  }
                  placeholder="Enter password for owner account"
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
