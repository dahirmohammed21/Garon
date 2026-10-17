import type { FormEvent } from "react";
import type { TaskStatus } from "../types";
export const statusLabels: Record<TaskStatus, string> = {
  pending: "Planerat",
  running: "Pågående",
  done: "Slutfört",
  cancelled: "Avbrutet",
  approval: "Väntar på beslut",
};
export const money = (n: number) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
export const date = (value: string, full = false) =>
  new Date(value).toLocaleString(
    "sv-SE",
    full
      ? {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Stockholm",
        }
      : { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" },
  );
export const relative = (value: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  return minutes === 0
    ? "Just nu"
    : minutes < 60
      ? `${minutes} min sedan`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} tim sedan`
        : date(value, true);
};
export const formObject = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  return Object.fromEntries(new FormData(event.currentTarget));
};
