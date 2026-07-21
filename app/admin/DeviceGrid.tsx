import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import type { DeviceStatus, DeviceType } from "@/lib/data";
import type { Devices } from "@/hooks/useAdminData";
import { DEVICE_META } from "@/lib/data";

const DEVICE_TYPES = Object.keys(DEVICE_META) as DeviceType[];

interface DeviceGridProps {
  devices: Devices;
  refresh: () => void;
}

export default function DeviceGrid({ devices, refresh }: DeviceGridProps) {
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<DeviceType>("PC");
  const [newDevicePrice, setNewDevicePrice] = useState(0);
  const [newDeviceError, setNewDeviceError] = useState<string | null>(null);
  const [newDeviceSubmitting, setNewDeviceSubmitting] = useState(false);

  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editDeviceType, setEditDeviceType] = useState<DeviceType>("PC");
  const [editDevicePrice, setEditDevicePrice] = useState(0);
  const [editDeviceError, setEditDeviceError] = useState<string | null>(null);
  const [editDeviceSaving, setEditDeviceSaving] = useState(false);

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    setNewDeviceSubmitting(true);
    setNewDeviceError(null);
    try {
      await api.post("/admin/devices", {
        name: newDeviceName,
        type: newDeviceType,
        pricePerHour: newDevicePrice,
      });
      setNewDeviceName("");
      setNewDevicePrice(0);
      refresh();
    } catch (err) {
      setNewDeviceError(getErrorMessage(err));
    } finally {
      setNewDeviceSubmitting(false);
    }
  }

  async function handleToggleStatus(deviceId: string, current: DeviceStatus) {
    await api.patch(`/admin/devices/${deviceId}/status`, {
      status: current === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE",
    });
    refresh();
  }

  function startEditDevice(
    deviceId: string,
    name: string,
    type: DeviceType,
    price: number,
  ) {
    setEditingDeviceId(deviceId);
    setEditDeviceName(name);
    setEditDeviceType(type);
    setEditDevicePrice(price);
    setEditDeviceError(null);
  }

  async function handleSaveDevice(deviceId: string) {
    setEditDeviceSaving(true);
    setEditDeviceError(null);
    try {
      await api.patch(`/admin/devices/${deviceId}`, {
        name: editDeviceName,
        type: editDeviceType,
        pricePerHour: editDevicePrice,
      });
      setEditingDeviceId(null);
      refresh();
    } catch (err) {
      setEditDeviceError(getErrorMessage(err));
    } finally {
      setEditDeviceSaving(false);
    }
  }

  async function handleDeleteDevice(deviceId: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/admin/devices/${deviceId}`);
      refresh();
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  }

  return (
    <>
      <div className="pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Add a device
      </div>
      <form
        onSubmit={handleAddDevice}
        className="bg-card border border-line rounded-2xl p-4 flex flex-col gap-4 mb-3 max-w-md"
      >
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Device name
          </label>
          <input
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="e.g. PC-05"
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEVICE_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setNewDeviceType(t)}
                className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  newDeviceType === t
                    ? "border-pink bg-(--pink-dim) text-pink"
                    : "border-line bg-bg-soft text-text-dim"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Price/hr (৳)
          </label>
          <input
            type="number"
            min={0}
            value={newDevicePrice}
            onChange={(e) => setNewDevicePrice(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <button
          type="submit"
          disabled={newDeviceSubmitting}
          className="px-4 py-2.5 rounded-lg font-display font-bold text-[13px] tracking-wide text-white whitespace-nowrap"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          {newDeviceSubmitting ? "Adding…" : "Add device"}
        </button>
      </form>
      {newDeviceError && (
        <div className="mb-3 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {newDeviceError}
        </div>
      )}

      <div className="pt-4 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        All devices ({devices.length})
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {devices.map((d) =>
          editingDeviceId === d.id ? (
            <div
              key={d.id}
              className="bg-card border border-pink rounded-2xl px-4 py-3 flex flex-col gap-2"
            >
              <input
                value={editDeviceName}
                onChange={(e) => setEditDeviceName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              <div className="flex gap-1.5">
                {DEVICE_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setEditDeviceType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold border ${
                      editDeviceType === t
                        ? "border-pink bg-(--pink-dim) text-pink"
                        : "border-line bg-bg-soft text-text-dim"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                value={editDevicePrice}
                onChange={(e) => setEditDevicePrice(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              {editDeviceError && (
                <div className="text-[11px] text-pink">{editDeviceError}</div>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleSaveDevice(d.id)}
                  disabled={editDeviceSaving}
                  className="flex-1 py-1.5 rounded-lg text-[11.5px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--pink), var(--purple))",
                  }}
                >
                  {editDeviceSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditingDeviceId(null)}
                  className="flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold text-text-dim bg-bg-soft border border-line"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={d.id}
              className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3"
            >
              <div>
                <div className="font-bold text-sm">{d.name}</div>
                <div className="text-xs text-text-dim mt-0.5">
                  {d.type} · ৳{d.pricePerHour}/hr
                </div>
                <div
                  className={`text-[10.5px] font-bold mt-1 ${
                    d.status === "MAINTENANCE"
                      ? "text-taken"
                      : d.isFreeNow
                        ? "text-lime"
                        : "text-gold"
                  }`}
                >
                  {d.status === "MAINTENANCE"
                    ? "MAINTENANCE"
                    : d.isFreeNow
                      ? "FREE"
                      : "IN USE"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => handleToggleStatus(d.id, d.status)}
                  className="text-[11px] font-semibold text-text-dim bg-bg-soft border border-line px-2.5 py-1.5 rounded-full whitespace-nowrap"
                >
                  {d.status === "MAINTENANCE"
                    ? "Set available"
                    : "Set maintenance"}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      startEditDevice(
                        d.id,
                        d.name,
                        d.type as DeviceType,
                        d.pricePerHour,
                      )
                    }
                    className="text-[10.5px] font-semibold text-text-dim bg-bg-soft border border-line px-2 py-1 rounded-full"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(d.id, d.name)}
                    className="text-[10.5px] font-semibold text-pink bg-[#ff2e9322] border border-pink px-2 py-1 rounded-full"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </>
  );
}
