import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, BedDouble, Wrench, User as UserIcon } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { useScopedData } from "../hooks/useScopedData";
import { useData } from "../stores/dataStore";
import { useAuth } from "../stores/authStore";
import type { Bed, Room } from "../types";
import { cn, formatCurrency } from "../lib/utils";
import { Avatar } from "../components/ui/Avatar";

export function Rooms() {
  const { user } = useAuth();
  const { fetchAll, isLoading: dataLoading } = useData();
  const { rooms, beds, tenants, hostelIds } = useScopedData();
  const {
    addRoom,
    addBed,
    updateBed,
    deleteRoom,
    assignTenantToBed,
    unassignTenant,
    updateRoom,
  } = useData();

  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [roomForm, setRoomForm] = useState({
    number: "",
    floor: 1,
    type: "double" as Room["type"],
    capacity: 2,
    rentPerBed: 6000,
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  // Move all hooks before early returns
  const floors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))).sort(),
    [rooms],
  );
  const filtered = useMemo(
    () =>
      floorFilter === "all"
        ? rooms
        : rooms.filter((r) => r.floor === floorFilter),
    [rooms, floorFilter],
  );
  const groupedByFloor = useMemo(() => {
    const map = new Map<number, Room[]>();
    filtered.forEach((r) => {
      if (!map.has(r.floor)) map.set(r.floor, []);
      map.get(r.floor)!.push(r);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading rooms...</div>
      </div>
    );
  }

  // Show message if no hostel is available
  if (hostelIds.length === 0) {
    return (
      <div>
        <PageHeader title="Rooms & Beds" subtitle="No hostel available" />
        <div className="card p-12 text-center text-ink-500">
          No hostel associated with your account. Please contact your super
          admin.
        </div>
      </div>
    );
  }

  const tenantById = (id?: string) => tenants.find((t) => t.id === id);
  const roomBeds = (roomId: string) => beds.filter((b) => b.roomId === roomId);
  const unassignedTenants = tenants.filter((t) => !t.bedId);
  const submitRoom = async () => {
    const hostelId = hostelIds[0];
    if (!hostelId || !roomForm.number) return;
    const room: Room = {
      id: "", // Backend will generate this
      hostelId,
      number: roomForm.number,
      floor: roomForm.floor,
      type: roomForm.type,
      capacity: roomForm.capacity,
      rentPerBed: roomForm.rentPerBed,
      facilities: ["WiFi", "Fan"],
      status: "active",
    };
    try {
      const createdRoom = await addRoom(room);
      const actualRoomId = createdRoom.id;
      for (let i = 0; i < roomForm.capacity; i++) {
        addBed({
          id: `${actualRoomId}_b${i}`,
          roomId: actualRoomId,
          hostelId,
          label: String.fromCharCode(65 + i),
          status: "vacant",
        });
      }
      setShowAddRoom(false);
      setRoomForm({
        number: "",
        floor: 1,
        type: "double",
        capacity: 2,
        rentPerBed: 6000,
      });
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const bedColor = (b: Bed) => {
    switch (b.status) {
      case "occupied":
        return "bg-brand-500 text-white border-brand-600 shadow-sm";
      case "maintenance":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "reserved":
        return "bg-violet-100 text-violet-700 border-violet-300";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    }
  };

  const selectedBedTenant = tenantById(selectedBed?.tenantId);
  const selectedBedRoom = rooms.find((r) => r.id === selectedBed?.roomId);

  return (
    <div>
      <PageHeader
        title="Rooms & Beds"
        subtitle={`${rooms.length} rooms • ${beds.length} beds • ${beds.filter((b) => b.status === "occupied").length} occupied`}
        actions={
          <button onClick={() => setShowAddRoom(true)} className="btn-primary">
            <Plus size={16} /> Add Room
          </button>
        }
      />

      <div className="card p-2 mb-4 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setFloorFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            floorFilter === "all"
              ? "bg-brand-600 text-white"
              : "text-ink-600 hover:bg-ink-100",
          )}
        >
          All Floors
        </button>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => setFloorFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              floorFilter === f
                ? "bg-brand-600 text-white"
                : "text-ink-600 hover:bg-ink-100",
            )}
          >
            Floor {f}
          </button>
        ))}
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-3 text-xs text-ink-500 px-3">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-brand-500" /> Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-200" /> Vacant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-200" /> Maintenance
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {groupedByFloor.map(([floor, floorRooms]) => (
          <div key={floor}>
            <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
                {floor}
              </span>
              Floor {floor}
              <span className="text-ink-400 font-normal">
                • {floorRooms.length} rooms
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {floorRooms.map((room, i) => {
                const rb = roomBeds(room.id);
                const occ = rb.filter((b) => b.status === "occupied").length;
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="card p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-ink-900">
                          Room {room.number}
                        </div>
                        <div className="text-xs text-ink-500 capitalize">
                          {room.type} • {formatCurrency(room.rentPerBed)}/bed
                        </div>
                      </div>
                      <span
                        className={cn(
                          "badge",
                          occ === room.capacity
                            ? "badge-red"
                            : occ === 0
                              ? "badge-green"
                              : "badge-yellow",
                        )}
                      >
                        {occ}/{room.capacity}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "grid gap-2",
                        room.capacity <= 2
                          ? "grid-cols-2"
                          : room.capacity === 3
                            ? "grid-cols-3"
                            : "grid-cols-2",
                      )}
                    >
                      {rb.map((b) => {
                        const tn = tenantById(b.tenantId);
                        return (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBed(b)}
                            className={cn(
                              "aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all hover:scale-105",
                              bedColor(b),
                            )}
                          >
                            <BedDouble size={18} />
                            <div className="text-[10px] font-bold mt-1">
                              Bed {b.label}
                            </div>
                            {tn && (
                              <div className="text-[9px] truncate w-full text-center opacity-90">
                                {tn.name.split(" ")[0]}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          updateRoom(room.id, {
                            status:
                              room.status === "maintenance"
                                ? "active"
                                : "maintenance",
                          });
                        }}
                        className="flex-1 text-xs py-1.5 rounded-lg hover:bg-ink-100 text-ink-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Wrench size={12} />{" "}
                        {room.status === "maintenance"
                          ? "Reactivate"
                          : "Maintenance"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete Room ${room.number}?`))
                            deleteRoom(room.id);
                        }}
                        className="text-xs py-1.5 px-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        title="Add New Room"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddRoom(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={submitRoom} className="btn-primary">
              Create Room
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Room Number *</label>
            <input
              className="input"
              value={roomForm.number}
              onChange={(e) =>
                setRoomForm({ ...roomForm, number: e.target.value })
              }
              placeholder="e.g. 201"
            />
          </div>
          <div>
            <label className="label">Floor</label>
            <input
              type="number"
              className="input"
              value={roomForm.floor}
              onChange={(e) =>
                setRoomForm({ ...roomForm, floor: +e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={roomForm.type}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  type: e.target.value as Room["type"],
                })
              }
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="quad">Quad</option>
              <option value="dorm">Dorm</option>
            </select>
          </div>
          <div>
            <label className="label">Beds Capacity</label>
            <input
              type="number"
              className="input"
              value={roomForm.capacity}
              onChange={(e) =>
                setRoomForm({ ...roomForm, capacity: +e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
            <label className="label">Rent per Bed (₹/month)</label>
            <input
              type="number"
              className="input"
              value={roomForm.rentPerBed}
              onChange={(e) =>
                setRoomForm({ ...roomForm, rentPerBed: +e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedBed}
        onClose={() => setSelectedBed(null)}
        title={
          selectedBed
            ? `Room ${selectedBedRoom?.number} • Bed ${selectedBed.label}`
            : ""
        }
      >
        {selectedBed && (
          <div className="space-y-4">
            <div className="card p-4 bg-ink-50">
              <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">
                Status
              </div>
              <div className="font-semibold text-ink-900 capitalize">
                {selectedBed.status}
              </div>
            </div>

            {selectedBedTenant ? (
              <div>
                <div className="text-sm font-medium text-ink-700 mb-2">
                  Currently assigned to
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <Avatar name={selectedBedTenant.name} />
                  <div className="flex-1">
                    <div className="font-semibold text-ink-900">
                      {selectedBedTenant.name}
                    </div>
                    <div className="text-xs text-ink-500">
                      {selectedBedTenant.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      unassignTenant(selectedBedTenant.id);
                      setSelectedBed({
                        ...selectedBed,
                        status: "vacant",
                        tenantId: undefined,
                      });
                    }}
                    className="btn-danger text-xs py-2"
                  >
                    Unassign
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium text-ink-700 mb-2">
                  Assign a tenant
                </div>
                {unassignedTenants.length === 0 ? (
                  <div className="text-sm text-ink-500 p-4 bg-ink-50 rounded-xl">
                    No unassigned tenants. Create one in the Tenants page first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {unassignedTenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          assignTenantToBed(t.id, selectedBed.id);
                          setSelectedBed(null);
                        }}
                        className="w-full flex items-center gap-3 p-3 card hover:border-brand-400 hover:bg-brand-50 transition-all text-left"
                      >
                        <Avatar name={t.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ink-900 truncate">
                            {t.name}
                          </div>
                          <div className="text-xs text-ink-500 truncate">
                            {t.email}
                          </div>
                        </div>
                        <UserIcon size={14} className="text-ink-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  updateBed(selectedBed.id, {
                    status:
                      selectedBed.status === "maintenance"
                        ? "vacant"
                        : "maintenance",
                  });
                  setSelectedBed(null);
                }}
                className="btn-secondary flex-1"
              >
                {selectedBed.status === "maintenance"
                  ? "Mark Available"
                  : "Mark Maintenance"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
