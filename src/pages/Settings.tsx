import { motion } from "framer-motion";
import { useEffect } from "react";
import { User, Bell, Lock, Building2, Palette } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../stores/authStore";
import { useData } from "../stores/dataStore";

export function Settings() {
  const { user } = useAuth();
  const { fetchAll, isLoading: dataLoading, hostels } = useData();

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  if (!user) return null;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading settings...</div>
      </div>
    );
  }

  const hostel = hostels.find((h) => h.id === user.hostelId);

  const sections = [
    {
      icon: User,
      title: "Profile",
      desc: "Update your personal info and avatar",
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Email, SMS and push notifications",
    },
    {
      icon: Lock,
      title: "Security",
      desc: "Password, 2FA, and active sessions",
    },
    {
      icon: Building2,
      title: "Hostel Info",
      desc: "Update hostel details and facilities",
    },
    {
      icon: Palette,
      title: "Appearance",
      desc: "Theme and display preferences",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="card p-6 mb-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="xl" />
          <div className="flex-1">
            <div className="text-xl font-bold">{user.name}</div>
            <div className="text-sm text-white/80">{user.email}</div>
            <div className="text-xs text-white/70 mt-1 capitalize">
              {user.role.replace("_", " ")}
              {hostel ? ` • ${hostel.name}` : ""}
            </div>
          </div>
          <button className="btn bg-white/15 backdrop-blur hover:bg-white/25 text-white">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="card p-5 text-left hover:shadow-md transition-all"
          >
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <s.icon size={20} />
            </div>
            <div className="font-semibold text-ink-900">{s.title}</div>
            <div className="text-sm text-ink-500 mt-0.5">{s.desc}</div>
          </motion.button>
        ))}
      </div>

      <div className="mt-6 card p-6">
        <div className="text-sm font-semibold text-ink-900 mb-1">
          About HostelHub
        </div>
        <div className="text-sm text-ink-500">
          Version 1.0.0 • Full-Stack Application
        </div>
        <div className="text-xs text-ink-400 mt-2">
          Connected to MySQL database with Node.js/Express backend.
        </div>
      </div>
    </div>
  );
}
