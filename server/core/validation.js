import { randomUUID } from "node:crypto";
export const statuses = ["pending", "running", "done", "cancelled", "approval"];
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function text(value, label, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`${label} måste innehålla 1–${max} tecken.`);
  return value.trim();
}
