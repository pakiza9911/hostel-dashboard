import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { Avatar } from "../components/ui/Avatar";
import { useScopedData } from "../hooks/useScopedData";
import { useData } from "../stores/dataStore";
import { useAuth } from "../stores/authStore";
import type { Payment } from "../types";
import { cn, formatCurrency, formatDate } from "../lib/utils";

export function Payments() {
  const { user } = useAuth();
  const { fetchAll, isLoading: dataLoading } = useData();
  const { payments, tenants } = useScopedData();
  const { markPaymentPaid } = useData();

  const [filter, setFilter] = useState<"all" | Payment["status"]>("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Payment | null>(null);

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  // Move hooks before early returns
  const filtered = useMemo(() => {
    return [...payments]
      .filter((p) => {
        if (filter !== "all" && p.status !== filter) return false;
        if (search) {
          const t = tenants.find((x) => x.id === p.tenantId);
          const q = search.toLowerCase();
          if (
            !t?.name.toLowerCase().includes(q) &&
            !p.invoiceNumber.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [payments, tenants, filter, search]);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading payments...</div>
      </div>
    );
  }

  const collected = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const pending = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const overdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Track rent collection, dues, and invoices"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Collected"
          value={formatCurrency(collected)}
          icon={CheckCircle2}
          color="emerald"
          delay={0}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(pending)}
          icon={Clock}
          color="amber"
          delay={0.05}
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(overdue)}
          icon={AlertCircle}
          color="rose"
          delay={0.1}
        />
      </div>

      <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or tenant..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["all", "paid", "pending", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors",
                filter === s
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-left px-4 py-3 font-medium">Tenant</th>
                <th className="text-left px-4 py-3 font-medium">For Month</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.slice(0, 50).map((p, i) => {
                const t = tenants.find((x) => x.id === p.tenantId);
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className="hover:bg-ink-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink-700">
                      {p.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={t?.name ?? "?"} size="xs" />
                        <span className="text-ink-900 font-medium">
                          {t?.name ?? "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{p.monthFor}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {formatDate(p.dueDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          p.status === "paid" && "badge-green",
                          p.status === "pending" && "badge-yellow",
                          p.status === "overdue" && "badge-red",
                          p.status === "partial" && "badge-blue",
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {p.status !== "paid" && (
                          <button
                            onClick={() => markPaymentPaid(p.id, "upi")}
                            className="btn-secondary text-xs py-1.5"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setViewing(p)}
                          className="btn-ghost text-xs py-1.5"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="px-4 py-3 text-center text-xs text-ink-500 border-t border-ink-100">
            Showing 50 of {filtered.length} results
          </div>
        )}
      </div>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Invoice Details"
        size="md"
      >
        {viewing &&
          (() => {
            const t = tenants.find((x) => x.id === viewing.tenantId);
            return (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-xs text-ink-500">INVOICE</div>
                    <div className="font-bold text-ink-900 text-lg">
                      {viewing.invoiceNumber}
                    </div>
                  </div>
                  <span
                    className={cn(
                      viewing.status === "paid" && "badge-green",
                      viewing.status === "pending" && "badge-yellow",
                      viewing.status === "overdue" && "badge-red",
                    )}
                  >
                    {viewing.status}
                  </span>
                </div>
                <div className="space-y-3 mb-6">
                  <Row label="Tenant" value={t?.name ?? "—"} />
                  <Row label="Month" value={viewing.monthFor} />
                  <Row label="Due Date" value={formatDate(viewing.dueDate)} />
                  {viewing.paidDate && (
                    <Row
                      label="Paid Date"
                      value={formatDate(viewing.paidDate)}
                    />
                  )}
                  <Row label="Method" value={viewing.method.toUpperCase()} />
                  <Row label="Type" value={viewing.type} />
                </div>
                <div className="card p-4 bg-brand-50 border-brand-200 flex items-center justify-between">
                  <div className="text-sm font-medium text-ink-700">
                    Total Amount
                  </div>
                  <div className="text-2xl font-bold text-brand-700">
                    {formatCurrency(viewing.amount)}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button className="btn-secondary">
                    <Download size={14} /> Download PDF
                  </button>
                  <button className="btn-secondary">
                    <FileText size={14} /> Send Email
                  </button>
                  {viewing.status !== "paid" && (
                    <button
                      onClick={() => {
                        markPaymentPaid(viewing.id, "upi");
                        setViewing(null);
                      }}
                      className="btn-primary"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900 capitalize">{value}</span>
    </div>
  );
}
