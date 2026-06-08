import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, Shield, Trash2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../stores/authStore";
import { useData } from "../stores/dataStore";
import type { Permission, User } from "../types";
import { cn, formatDate } from "../lib/utils";

const ALL_PERMS: { id: Permission; label: string; desc: string }[] = [
  {
    id: "view_dashboard",
    label: "Dashboard",
    desc: "View analytics and overview",
  },
  {
    id: "manage_rooms",
    label: "Rooms & Beds",
    desc: "Add/edit rooms and assign beds",
  },
  {
    id: "manage_tenants",
    label: "Tenants",
    desc: "Add/edit tenants and check-out",
  },
  {
    id: "manage_payments",
    label: "Payments",
    desc: "View and mark payments paid",
  },
  {
    id: "manage_maintenance",
    label: "Maintenance",
    desc: "Manage support tickets",
  },
  { id: "view_analytics", label: "Analytics", desc: "View detailed reports" },
];

export function Staff() {
  const { user } = useAuth();
  const {
    fetchAll,
    isLoading: dataLoading,
    users,
    addUser,
    updateUser,
    deleteUser,
  } = useData();

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    permissions: Permission[];
  }>({
    name: "",
    email: "",
    password: "",
    permissions: ["view_dashboard"],
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  if (!user) return null;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading staff...</div>
      </div>
    );
  }
  const isSuperAdmin = user.role === "super_admin";

  // Owners see only their managers; super admin sees all owners
  const list = isSuperAdmin
    ? users.filter((u) => u.role === "owner")
    : users.filter((u) => u.role === "manager" && u.hostelId === user.hostelId);

  const startNew = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      password: "",
      permissions: ["view_dashboard"],
    });
    setShowAdd(true);
  };

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      permissions: u.permissions ?? [],
    });
    setShowAdd(true);
  };

  const submit = () => {
    if (!form.name || !form.email) return;
    if (!editing && !form.password) {
      alert("Password is required for new managers");
      return;
    }
    if (editing) {
      updateUser(editing.id, {
        name: form.name,
        email: form.email,
        permissions: form.permissions,
      });
    } else {
      const newUser: User = {
        id: `u_${Date.now()}`,
        name: form.name,
        email: form.email,
        role: "manager",
        hostelId: user.hostelId,
        permissions: form.permissions,
        createdAt: new Date().toISOString(),
      };
      addUser({ ...newUser, password: form.password });
    }
    setShowAdd(false);
  };

  const togglePerm = (p: Permission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  };

  return (
    <div>
      <PageHeader
        title={isSuperAdmin ? "Hostel Owners" : "Staff & Managers"}
        subtitle={
          isSuperAdmin
            ? `${list.length} owners across your portfolio`
            : `${list.length} team members with access`
        }
        actions={
          !isSuperAdmin && (
            <button onClick={startNew} className="btn-primary">
              <Plus size={16} /> Invite Manager
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <Avatar name={u.name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink-900 truncate">
                  {u.name}
                </div>
                <div className="text-xs text-ink-500 truncate flex items-center gap-1">
                  <Mail size={11} /> {u.email}
                </div>
                <div className="mt-1.5">
                  <span
                    className={cn(
                      "badge",
                      u.role === "owner" ? "badge-blue" : "badge-green",
                    )}
                  >
                    <Shield size={10} />{" "}
                    {u.role === "owner" ? "Owner" : "Manager"}
                  </span>
                </div>
              </div>
            </div>
            {u.permissions && u.permissions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-ink-100">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-medium mb-1.5">
                  Permissions
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.permissions.map((p) => (
                    <span key={p} className="badge-gray text-[10px]">
                      {p.replace("_", " ").replace("manage", "")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
              <span className="text-xs text-ink-400">
                Added {formatDate(u.createdAt)}
              </span>
              {!isSuperAdmin && u.role === "manager" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(u)}
                    className="text-xs px-2 py-1 rounded-lg hover:bg-ink-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${u.name}?`)) deleteUser(u.id);
                    }}
                    className="text-xs p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editing ? "Edit Manager" : "Invite Manager"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={submit} className="btn-primary">
              {editing ? "Save" : "Send Invite"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password for manager account"
              />
            </div>
          )}
          <div>
            <label className="label">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMS.map((p) => {
                const active = form.permissions.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerm(p.id)}
                    className={cn(
                      "card p-3 text-left transition-all",
                      active
                        ? "border-brand-400 bg-brand-50"
                        : "hover:border-ink-200",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-ink-900">
                        {p.label}
                      </div>
                      <div
                        className={cn(
                          "h-4 w-4 rounded border-2 flex items-center justify-center",
                          active
                            ? "bg-brand-600 border-brand-600"
                            : "border-ink-300",
                        )}
                      >
                        {active && (
                          <div className="h-1.5 w-1.5 bg-white rounded-sm" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-ink-500">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
