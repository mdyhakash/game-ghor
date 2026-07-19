import {
  DEVICES,
  type Device,
  type DeviceStatus,
  type DeviceType,
  type Booking,
} from "@/lib/data";
import { KEYS, read, write } from "./keys";

/** DEVICES with any admin-set status overrides (e.g. put into MAINTENANCE) applied. */
export function getEffectiveDevices(): Device[] {
  const overrides = read<Record<string, DeviceStatus>>(
    KEYS.deviceOverrides,
    {},
  );
  return DEVICES.map((d) =>
    overrides[d.id] ? { ...d, status: overrides[d.id] } : d,
  );
}

// -----------------------------------------------------------------------
// Devices (live free/busy status is derived from bookings in storage)
// -----------------------------------------------------------------------
export function getDevices(): (Device & { isFreeNow: boolean })[] {
  const devices = getEffectiveDevices();
  const bookings = read<Booking[]>(KEYS.bookings, []);
  const now = Date.now();
  return devices.map((device) => {
    const activeBooking = bookings.find(
      (b) =>
        b.deviceId === device.id &&
        (b.status === "WAITING" || b.status === "ACTIVE") &&
        new Date(b.startTime).getTime() <= now &&
        new Date(b.endTime).getTime() >= now,
    );
    return {
      ...device,
      isFreeNow: device.status === "AVAILABLE" && !activeBooking,
    };
  });
}

export function getAdminDevices() {
  return getDevices(); // same live free/busy view the customer site uses
}

export function setDeviceStatus(deviceId: string, status: DeviceStatus) {
  const overrides = read<Record<string, DeviceStatus>>(
    KEYS.deviceOverrides,
    {},
  );
  write(KEYS.deviceOverrides, { ...overrides, [deviceId]: status });
}

/** Current price/hr for a device type, used for the admin walk-in form preview. */
export function getDeviceTypePrice(deviceType: DeviceType): number {
  const devices = getEffectiveDevices().filter(
    (d) => d.type === deviceType && d.status === "AVAILABLE",
  );
  return devices[0]?.pricePerHour ?? 0;
}
