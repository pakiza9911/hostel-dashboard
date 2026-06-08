import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { Avatar } from "../components/ui/Avatar";
import { useScopedData } from "../hooks/useScopedData";
import { useData } from "../stores/dataStore";
import { useAuth } from "../stores/authStore";
import type { MaintenanceTicket } from "../types";
import { cn, formatDate } from "../lib/utils";

const PRIORITY_COLORS: Record<MaintenanceTicket["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-rose-50 text-rose-700",
};

export function Maintenance() {
  const { user } = useAuth();
  const { fetchAll, isLoading: dataLoading } = useData();
  const { tickets, tenants, rooms, hostelIds } = useScopedData();
  const { addTicket, updateTicket } = useData();

  const [filter] = useState<"all" | MaintenanceTicket["status"]>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "plumbing" as MaintenanceTicket["category"],
    priority: "medium" as MaintenanceTicket["priority"],
    roomId: "",
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  // Move hooks before early returns
  const grouped = useMemo(() => {
    const list =
      filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
    return {
      open: list.filter((t) => t.status === "open"),
      in_progress: list.filter((t) => t.status === "in_progress"),
      resolved: list.filter((t) => t.status === "resolved"),
      closed: list.filter((t) => t.status === "closed"),
    };
  }, [tickets, filter]);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading maintenance tickets...</div>
      </div>
    );
  }

  const submit = () => {
    if (!form.title || !hostelIds[0]) return;
    const t: MaintenanceTicket = {
      id: `tk_${Date.now()}`,
      hostelId: hostelIds[0],
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      roomId: form.roomId || undefined,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    addTicket(t);
    setShowAdd(false);
    setForm({
      title: "",
      description: "",
      category: "plumbing",
      priority: "medium",
      roomId: "",
    });
  };

  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Track issues, assign staff, and resolve quickly"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} /> New Ticket
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={AlertCircle}
          label="Open"
          value={counts.open}
          color="rose"
          delay={0}
        />
        <SummaryCard
          icon={Clock}
          label="In Progress"
          value={counts.in_progress}
          color="amber"
          delay={0.05}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Resolved"
          value={counts.resolved}
          color="emerald"
          delay={0.1}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["open", "in_progress", "resolved", "closed"] as const).map(
          (status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-ink-900 capitalize">
                  {status.replace("_", " ")}
                </h3>
                <span className="text-xs text-ink-500 font-medium px-2 py-0.5 rounded-full bg-ink-100">
                  {grouped[status].length}
                </span>
              </div>
              <div className="space-y-2 min-h-[80px]">
                {grouped[status].map((t, i) => {
                  const tenant = tenants.find((x) => x.id === t.tenantId);
                  const room = rooms.find((x) => x.id === t.roomId);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="card p-3 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-ink-900 text-sm leading-tight">
                          {t.title}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase shrink-0",
                            PRIORITY_COLORS[t.priority],
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <div className="text-xs text-ink-500 mb-3 line-clamp-2">
                        {t.description}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {tenant && <Avatar name={tenant.name} size="xs" />}
                          <span className="text-ink-600">
                            {room ? `Room ${room.number}` : "Common Area"}
                          </span>
                        </div>
                        <span className="text-ink-400">
                          {formatDate(t.createdAt)}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2 pt-2 border-t border-ink-100">
                        {status === "open" && (
                          <button
                            onClick={() =>
                              updateTicket(t.id, { status: "in_progress" })
                            }
                            className="text-xs flex-1 py-1 hover:bg-amber-50 text-amber-700 rounded transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {status === "in_progress" && (
                          <button
                            onClick={() =>
                              updateTicket(t.id, {
                                status: "resolved",
                                resolvedAt: new Date().toISOString(),
                              })
                            }
                            className="text-xs flex-1 py-1 hover:bg-emerald-50 text-emerald-700 rounded transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        {status === "resolved" && (
                          <button
                            onClick={() =>
                              updateTicket(t.id, { status: "closed" })
                            }
                            className="text-xs flex-1 py-1 hover:bg-ink-100 text-ink-700 rounded transition-colors"
                          >
                            Close
                          </button>
                        )}
                        {status === "closed" && (
                          <button
                            onClick={() =>
                              updateTicket(t.id, { status: "open" })
                            }
                            className="text-xs flex-1 py-1 hover:bg-ink-100 text-ink-700 rounded transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {grouped[status].length === 0 && (
                  <div className="card p-4 text-center text-xs text-ink-400 border-dashed">
                    No tickets
                  </div>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New Maintenance Ticket"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={submit} className="btn-primary">
              Create Ticket
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Leaking tap in bathroom"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as MaintenanceTicket["category"],
                  })
                }
              >
                {(
                  [
                    "plumbing",
                    "electrical",
                    "furniture",
                    "cleaning",
                    "wifi",
                    "other",
                  ] as const
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as MaintenanceTicket["priority"],
                  })
                }
              >
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Room (optional)</label>
            <select
              className="input"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            >
              <option value="">Common area</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.number} (Floor {r.floor})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, delay }: any) {
  const map: any = {
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-5 flex items-center gap-4"
    >
      <div
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          map[color],
        )}
      >
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-ink-900">{value}</div>
        <div className="text-sm text-ink-500">{label}</div>
      </div>
    </motion.div>
  );
}
