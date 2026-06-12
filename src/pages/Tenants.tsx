import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  LogOut,
  Upload,
  FileImage,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { Avatar } from "../components/ui/Avatar";
import { useScopedData } from "../hooks/useScopedData";
import { useData } from "../stores/dataStore";
import { useAuth } from "../stores/authStore";
import type { Tenant } from "../types";
import { cn, formatCurrency, formatDate } from "../lib/utils";

export function Tenants() {
  const { user } = useAuth();
  const { fetchAll, isLoading: dataLoading } = useData();
  const { tenants, rooms, beds, hostelIds } = useScopedData();
  const {
    addTenant,
    updateTenant,
    deleteTenant,
    assignTenantToBed,
    unassignTenant,
  } = useData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Tenant["status"]>(
    "all",
  );
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState<Tenant | null>(null);
  const [assigning, setAssigning] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Partial<Tenant>>({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    idType: "cnic",
    idNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    address: "",
    monthlyRent: 6000,
    securityDeposit: 12000,
    occupation: "",
    idCardImage: "",
  });
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  // Move all hooks before early returns
  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (
        search &&
        !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !t.email.toLowerCase().includes(search.toLowerCase()) &&
        !t.phone.includes(search)
      )
        return false;
      return true;
    });
  }, [tenants, search, statusFilter]);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading tenants...</div>
      </div>
    );
  }

  const submit = () => {
    if (!form.name || !form.email || !hostelIds[0] || !form.idCardImage) return;
    const tenant: Tenant = {
      id: `t_${Date.now()}`,
      hostelId: hostelIds[0],
      name: form.name!,
      email: form.email!,
      phone: form.phone ?? "",
      gender: form.gender as Tenant["gender"],
      idType: form.idType as Tenant["idType"],
      idNumber: form.idNumber ?? "",
      emergencyContactName: form.emergencyContactName ?? "",
      emergencyContactPhone: form.emergencyContactPhone ?? "",
      address: form.address ?? "",
      joinDate: new Date().toISOString().slice(0, 10),
      monthlyRent: form.monthlyRent ?? 6000,
      securityDeposit: form.securityDeposit ?? 12000,
      status: "pending",
      occupation: form.occupation,
      idCardImage: form.idCardImage,
    };
    addTenant(tenant);
    setShowAdd(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      gender: "male",
      idType: "cnic",
      idNumber: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      address: "",
      monthlyRent: 6000,
      securityDeposit: 12000,
      occupation: "",
      idCardImage: "",
    });
    setIdCardFile(null);
    setIdCardPreview("");
  };

  const checkout = (t: Tenant) => {
    if (!confirm(`Check out ${t.name}? Their bed will be vacated.`)) return;
    unassignTenant(t.id);
    updateTenant(t.id, {
      status: "checked_out",
      checkoutDate: new Date().toISOString().slice(0, 10),
    });
    setViewing(null);
  };

  const vacantBeds = beds.filter((b) => b.status === "vacant");

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle={`${tenants.length} total • ${tenants.filter((t) => t.status === "active").length} active`}
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} /> Add Tenant
          </button>
        }
      />

      <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "pending", "checked_out"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors",
                statusFilter === s
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No tenants found"
          description="Try adjusting filters or add a new tenant."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Tenant</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Room / Bed
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Rent</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((t, i) => {
                  const room = rooms.find((r) => r.id === t.roomId);
                  const bed = beds.find((b) => b.id === t.bedId);
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-ink-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={t.name} size="sm" />
                          <div>
                            <div className="font-medium text-ink-900">
                              {t.name}
                            </div>
                            <div className="text-xs text-ink-500">
                              {t.occupation ?? "Tenant"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600 text-xs">
                        <div>{t.phone}</div>
                        <div className="text-ink-400">{t.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {room ? (
                          <span className="badge-blue">
                            Room {room.number} • Bed {bed?.label}
                          </span>
                        ) : (
                          <span className="badge-gray">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-900">
                        {formatCurrency(t.monthlyRent)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            t.status === "active" && "badge-green",
                            t.status === "pending" && "badge-yellow",
                            t.status === "checked_out" && "badge-gray",
                          )}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {!t.bedId && t.status !== "checked_out" && (
                            <button
                              onClick={() => setAssigning(t)}
                              className="btn-secondary text-xs py-1.5"
                            >
                              Assign Bed
                            </button>
                          )}
                          <button
                            onClick={() => setViewing(t)}
                            className="btn-ghost text-xs py-1.5"
                          >
                            View
                          </button>
                          {t.status === "active" && (
                            <button
                              onClick={() => checkout(t)}
                              className="btn-danger text-xs py-1.5"
                              title="Check Out"
                            >
                              <LogOut size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Tenant"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!form.name || !form.email || !form.idCardImage}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Tenant
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value as Tenant["gender"] })
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">ID Type</label>
            <select
              className="input"
              value={form.idType}
              onChange={(e) =>
                setForm({ ...form, idType: e.target.value as Tenant["idType"] })
              }
            >
              <option value="cnic">CNIC</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">ID Number</label>
            <input
              className="input"
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Occupation</label>
            <input
              className="input"
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Monthly Rent (₹)</label>
            <input
              type="number"
              className="input"
              value={form.monthlyRent}
              onChange={(e) =>
                setForm({ ...form, monthlyRent: +e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Security Deposit (₹)</label>
            <input
              type="number"
              className="input"
              value={form.securityDeposit}
              onChange={(e) =>
                setForm({ ...form, securityDeposit: +e.target.value })
              }
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
            <label className="label">Emergency Contact Name</label>
            <input
              className="input"
              value={form.emergencyContactName}
              onChange={(e) =>
                setForm({ ...form, emergencyContactName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Emergency Contact Phone</label>
            <input
              className="input"
              value={form.emergencyContactPhone}
              onChange={(e) =>
                setForm({ ...form, emergencyContactPhone: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">
              ID Card Image *{" "}
              <span className="text-ink-400 text-xs">(Required)</span>
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 text-center transition-colors",
                    idCardPreview
                      ? "border-brand-400 bg-brand-50"
                      : "border-ink-300 hover:border-brand-400 hover:bg-ink-50",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIdCardFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setIdCardPreview(base64);
                          setForm({ ...form, idCardImage: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    {idCardPreview ? (
                      <>
                        <FileImage className="text-brand-600" size={24} />
                        <span className="text-sm text-brand-700 font-medium">
                          {idCardFile?.name}
                        </span>
                        <span className="text-xs text-ink-500">
                          Click to change
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-ink-400" size={24} />
                        <span className="text-sm text-ink-600">
                          Click to upload ID card image
                        </span>
                        <span className="text-xs text-ink-400">
                          JPG, PNG up to 5MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </label>
              {idCardPreview && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={idCardPreview}
                    alt="ID Card Preview"
                    className="w-full h-full object-cover rounded-lg border border-ink-200"
                  />
                </div>
              )}
            </div>
            {!form.idCardImage && (
              <p className="text-xs text-red-500 mt-1">
                ID card image is required
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Tenant Details"
        size="lg"
      >
        {viewing && (
          <div>
            <div className="flex items-start gap-4 mb-6">
              <Avatar name={viewing.name} size="xl" />
              <div className="flex-1">
                <div className="text-xl font-bold text-ink-900">
                  {viewing.name}
                </div>
                <div className="text-sm text-ink-500 capitalize">
                  {viewing.gender} • {viewing.occupation ?? "—"}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={cn(
                      viewing.status === "active" && "badge-green",
                      viewing.status === "pending" && "badge-yellow",
                      viewing.status === "checked_out" && "badge-gray",
                    )}
                  >
                    {viewing.status.replace("_", " ")}
                  </span>
                  {viewing.bedId &&
                    (() => {
                      const r = rooms.find((x) => x.id === viewing.roomId);
                      const b = beds.find((x) => x.id === viewing.bedId);
                      return (
                        <span className="badge-blue">
                          Room {r?.number} • Bed {b?.label}
                        </span>
                      );
                    })()}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field icon={Phone} label="Phone" value={viewing.phone} />
              <Field icon={Mail} label="Email" value={viewing.email} />
              <Field
                icon={Calendar}
                label="Joined"
                value={formatDate(viewing.joinDate)}
              />
              <Field
                icon={BedDouble}
                label="Monthly Rent"
                value={formatCurrency(viewing.monthlyRent)}
              />
              <Field
                icon={Phone}
                label="Emergency Contact"
                value={`${viewing.emergencyContactName} (${viewing.emergencyContactPhone})`}
              />
              <Field
                icon={Mail}
                label="ID"
                value={`${viewing.idType.toUpperCase()}: ${viewing.idNumber}`}
              />
            </div>
            {viewing.idCardImage && (
              <div className="mt-4">
                <label className="label flex items-center gap-2">
                  <FileImage size={14} />
                  ID Card Image
                </label>
                <div className="mt-1">
                  <img
                    src={viewing.idCardImage}
                    alt="ID Card"
                    className="max-w-xs max-h-48 object-contain rounded-lg border border-ink-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(viewing.idCardImage, "_blank")}
                  />
                  <p className="text-xs text-ink-400 mt-1">
                    Click image to view full size
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
              {viewing.bedId && (
                <button
                  onClick={() => {
                    unassignTenant(viewing.id);
                    setViewing({
                      ...viewing,
                      bedId: undefined,
                      roomId: undefined,
                    });
                  }}
                  className="btn-secondary"
                >
                  Unassign Bed
                </button>
              )}
              {viewing.status !== "checked_out" && (
                <button
                  onClick={() => checkout(viewing)}
                  className="btn-danger"
                >
                  Check Out
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`Permanently delete ${viewing.name}?`)) {
                    deleteTenant(viewing.id);
                    setViewing(null);
                  }
                }}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title={`Assign Bed to ${assigning?.name ?? ""}`}
      >
        {assigning && (
          <div>
            {vacantBeds.length === 0 ? (
              <div className="text-sm text-ink-500 p-4 bg-ink-50 rounded-xl">
                No vacant beds available.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {vacantBeds.map((b) => {
                  const r = rooms.find((x) => x.id === b.roomId);
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        assignTenantToBed(assigning.id, b.id);
                        updateTenant(assigning.id, { status: "active" });
                        setAssigning(null);
                      }}
                      className="card p-3 text-center hover:border-brand-400 hover:bg-brand-50 transition-all"
                    >
                      <BedDouble className="mx-auto text-brand-600" size={18} />
                      <div className="font-semibold text-ink-900 mt-1 text-sm">
                        Room {r?.number}
                      </div>
                      <div className="text-xs text-ink-500">
                        Bed {b.label} • F{r?.floor}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
        <Icon size={12} /> {label}
      </div>
      <div className="text-sm font-medium text-ink-900">{value}</div>
    </div>
  );
}
