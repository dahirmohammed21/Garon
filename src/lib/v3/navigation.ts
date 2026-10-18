import {
  Activity,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
export type Route = {
  page:
    | "home"
    | "approvals"
    | "inbox"
    | "scheduled"
    | "activity"
    | "businesses"
    | "business"
    | "settings";
  businessId?: string;
  section?: string;
};
export const headquarters = [
  { page: "home", title: "Översikt", icon: LayoutDashboard },
  { page: "approvals", title: "Godkännanden", icon: ShieldCheck },
  { page: "inbox", title: "Inkorg", icon: Inbox },
  { page: "scheduled", title: "Schemalagt", icon: CalendarClock },
  { page: "activity", title: "Aktivitet", icon: Activity },
] as const;
export function readRoute(): Route {
  const [page, businessId, section] = location.hash.slice(1).split("/");
  if (page === "business" && businessId)
    return { page, businessId, section: section || "overview" };
  if (page === "settings")
    return { page: "settings", section: businessId || "appearance" };
  if (
    [
      "approvals",
      "inbox",
      "scheduled",
      "activity",
      "businesses",
      "settings",
    ].includes(page)
  )
    return { page: page as Route["page"] };
  // Old bookmarks retain access to saved information, through the new structure.
  if (page === "memory") return { page: "settings", section: "memory" };
  if (page === "integrations") return { page: "settings", section: "plugins" };
  if (page === "finance") return { page: "settings", section: "models" };
  return { page: "home" };
}
export function routeHash(route: Route) {
  return route.page === "business"
    ? `#business/${route.businessId}/${route.section || "overview"}`
    : `#${route.page}${route.page === "settings" && route.section ? `/${route.section}` : ""}`;
}
