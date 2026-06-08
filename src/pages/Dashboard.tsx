import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Building2,
  Users,
  BedDouble,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { PageHeader } from "../components/ui/PageHeader";
import { useScopedData } from "../hooks/useScopedData";
import { useAuth } from "../stores/authStore";
import { useData } from "../stores/dataStore";
import { formatCurrency, formatDate } from "../lib/utils";
import { Avatar } from "../components/ui/Avatar";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { user } = useAuth();
  const { fetchAll, isLoading: dataLoading } = useData();
  const {
    hostels,
    beds,
    tenants,
    payments,
    tickets,
    isSuperAdmin,
    currentHostel,
  } = useScopedData();

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading dashboard...</div>
      </div>
    );
  }

  // Show message for owners without a hostel
  if (user?.role === "owner" && !currentHostel && hostels.length === 0) {
    return (
      <div>
        <PageHeader
          title="Welcome to HostelHub"
          subtitle="No hostel assigned to your account"
        />
        <div className="card p-12 text-center">
          <Building2 size={64} className="mx-auto mb-4 text-ink-300" />
          <h2 className="text-xl font-semibold text-ink-900 mb-2">
            No Hostel Found
          </h2>
          <p className="text-ink-500 mb-6">
            You don't have a hostel associated with your account. Please contact
            your super admin to create and assign a hostel to you.
          </p>
        </div>
      </div>
    );
  }

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
  const occupancy = totalBeds
    ? Math.round((occupiedBeds / totalBeds) * 100)
    : 0;
  const monthlyRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingDues = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  // Revenue trend (last 6 months)
  const revenueData = (() => {
    const map = new Map<string, number>();
    payments
      .filter((p) => p.status === "paid")
      .forEach((p) => {
        map.set(p.monthFor, (map.get(p.monthFor) ?? 0) + p.amount);
      });
    const entries = Array.from(map.entries()).sort();
    return entries.slice(-6).map(([month, value]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", {
        month: "short",
      }),
      revenue: value,
    }));
  })();

  const occupancyData = [
    { name: "Occupied", value: occupiedBeds, color: "#3563ff" },
    { name: "Vacant", value: totalBeds - occupiedBeds, color: "#e2e8f0" },
  ];

  // Per hostel comparison (super admin)
  const hostelComparison = hostels.map((h) => ({
    name: h.name.split(" ")[0],
    revenue: h.monthlyRevenue / 1000,
    occupancy: Math.round((h.occupiedBeds / h.totalBeds) * 100),
  }));

  const recentPayments = [...payments]
    .filter((p) => p.status === "paid" && p.paidDate)
    .sort((a, b) => (b.paidDate! > a.paidDate! ? 1 : -1))
    .slice(0, 5);
  const recentTickets = [...tickets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.name.split(" ")[0]} 👋`}
        subtitle={
          isSuperAdmin
            ? currentHostel
              ? `Showing ${currentHostel.name}`
              : `Managing ${hostels.length} hostels across all locations`
            : `${currentHostel?.name ?? "Your hostel"} • ${currentHostel?.city ?? ""}`
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isSuperAdmin && !currentHostel ? (
          <StatCard
            label="Total Hostels"
            value={hostels.length}
            icon={Building2}
            color="brand"
            trend={{ value: 12, positive: true }}
            delay={0}
          />
        ) : (
          <StatCard
            label="Occupancy"
            value={`${occupancy}%`}
            icon={BedDouble}
            color="brand"
            trend={{ value: 4, positive: true }}
            delay={0}
          />
        )}
        <StatCard
          label="Total Tenants"
          value={tenants.length}
          icon={Users}
          color="emerald"
          trend={{ value: 8, positive: true }}
          delay={0.05}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={Banknote}
          color="violet"
          trend={{ value: 6, positive: true }}
          delay={0.1}
        />
        <StatCard
          label="Open Issues"
          value={openTickets}
          icon={AlertCircle}
          color="amber"
          trend={{ value: 3, positive: false }}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink-900">Revenue Trend</h3>
              <p className="text-xs text-ink-500">Last 6 months performance</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-ink-900">
                {formatCurrency(monthlyRevenue)}
              </div>
              <div className="text-xs text-emerald-600 font-medium">
                +12.5% vs last period
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3563ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3563ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eef0f5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3563ff"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-ink-900">Bed Occupancy</h3>
          <p className="text-xs text-ink-500">Live status across all rooms</p>
          <div className="h-48 mt-2 relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={occupancyData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                >
                  {occupancyData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold text-ink-900">
                {occupancy}%
              </div>
              <div className="text-xs text-ink-500">Occupied</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-brand-50 p-3">
              <div className="text-xs text-brand-700 font-medium">Occupied</div>
              <div className="text-lg font-bold text-brand-900">
                {occupiedBeds}
              </div>
            </div>
            <div className="rounded-xl bg-ink-100 p-3">
              <div className="text-xs text-ink-600 font-medium">Vacant</div>
              <div className="text-lg font-bold text-ink-900">
                {totalBeds - occupiedBeds}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {isSuperAdmin && !currentHostel && hostels.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink-900">Hostel Performance</h3>
              <p className="text-xs text-ink-500">
                Compare across your portfolio
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={hostelComparison}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eef0f5"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue (₹k)"
                  fill="#3563ff"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="occupancy"
                  name="Occupancy %"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink-900">Recent Payments</h3>
              <p className="text-xs text-ink-500">
                {formatCurrency(pendingDues)} pending
              </p>
            </div>
            <Link
              to="/payments"
              className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments.length === 0 && (
              <div className="text-center text-sm text-ink-500 py-8">
                No payments yet
              </div>
            )}
            {recentPayments.map((p) => {
              const t = tenants.find((x) => x.id === p.tenantId);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors"
                >
                  <Avatar name={t?.name ?? "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">
                      {t?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-ink-500">
                      {p.invoiceNumber} • {formatDate(p.paidDate!)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-emerald-600">
                      +{formatCurrency(p.amount)}
                    </div>
                    <div className="text-xs text-ink-500 uppercase">
                      {p.method}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink-900">
                Maintenance Tickets
              </h3>
              <p className="text-xs text-ink-500">
                {openTickets} open issues need attention
              </p>
            </div>
            <Link
              to="/maintenance"
              className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTickets.length === 0 && (
              <div className="text-center text-sm text-ink-500 py-8">
                No tickets yet
              </div>
            )}
            {recentTickets.map((t) => {
              const statusColor: Record<string, string> = {
                open: "badge-red",
                in_progress: "badge-yellow",
                resolved: "badge-green",
                closed: "badge-gray",
              };
              const Icon =
                t.status === "resolved" || t.status === "closed"
                  ? CheckCircle2
                  : t.status === "in_progress"
                    ? Clock
                    : AlertCircle;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center text-ink-600">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">
                      {t.title}
                    </div>
                    <div className="text-xs text-ink-500 capitalize">
                      {t.category} • {formatDate(t.createdAt)}
                    </div>
                  </div>
                  <span className={statusColor[t.status]}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
