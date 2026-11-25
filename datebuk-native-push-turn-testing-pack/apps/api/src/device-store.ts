import type { RegisteredDevice } from "./types";

/**
 * Replace this in-memory example with the existing DateBuk Prisma Device table.
 */
const devices = new Map<string, RegisteredDevice>();

export function saveDevice(device: RegisteredDevice) {
  devices.set(device.id, device);
  return device;
}

export function findUserDevices(userId: string) {
  return [...devices.values()].filter(
    device => device.userId === userId && device.enabled
  );
}

export function removeToken(token: string) {
  for (const [id, device] of devices) {
    if (device.token === token) devices.delete(id);
  }
}
