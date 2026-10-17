import {
  Activity,
  BookOpen,
  Building2,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Network,
  Plug,
  Settings,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { Page } from "../types";
type NavigationItem = {
  id: Page;
  title: string;
  description: string;
  icon: typeof Activity;
};
export const groups: { title: string; items: NavigationItem[] }[] = [
  {
    title: "HUVUDKONTOR",
    items: [
      {
        id: "overview",
        title: "Översikt",
        description:
          "Dina verksamheter, prioriteringar och beslut. Samlat på en plats.",
        icon: LayoutDashboard,
      },
      {
        id: "chat",
        title: "GARON – Min affärspartner",
        description:
          "Din centrala kontaktpunkt för strategi, idéer och operativa instruktioner.",
        icon: MessageSquare,
      },
      {
        id: "businesses",
        title: "Verksamheter",
        description:
          "Ett huvudkontor. Flera verksamheter. En gemensam riktning.",
        icon: Building2,
      },
      {
        id: "projects",
        title: "Projekt",
        description:
          "Från verksamhetens mål till projekt och konkreta uppdrag.",
        icon: FolderKanban,
      },
      {
        id: "approvals",
        title: "Beslut & godkännanden",
        description:
          "Du har sista ordet. Granska de uppdrag som väntar på ditt beslut.",
        icon: ShieldCheck,
      },
      {
        id: "activity",
        title: "Aktivitet & rapporter",
        description:
          "Följ verkliga händelser i arbetsytan. AI-rapporter kommer i en senare fas.",
        icon: Activity,
      },
    ],
  },
  {
    title: "ORGANISATION",
    items: [
      {
        id: "leadership",
        title: "AI-ledning",
        description:
          "En planerad organisation med dig som ägare och GARON som central kontaktpunkt.",
        icon: UsersRound,
      },
      {
        id: "agents",
        title: "Agentnätverk",
        description:
          "Dina sparade agentroller. Självständig körning kommer i en senare fas.",
        icon: Network,
      },
      {
        id: "memory",
        title: "Minne & kunskap",
        description:
          "Samla mål, idéer och lärdomar. Befintliga anteckningar finns kvar.",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        id: "finance",
        title: "Ekonomi & AI-kostnader",
        description:
          "Lokal AI-budget och historisk användning. Verksamheternas bokföring ingår inte ännu.",
        icon: Wallet,
      },
      {
        id: "integrations",
        title: "Integrationer",
        description:
          "En överblick över planerade anslutningar och vad som faktiskt är tillgängligt.",
        icon: Plug,
      },
      {
        id: "settings",
        title: "Inställningar",
        description: "Din lokala arbetsyta, dina data och dina gränser.",
        icon: Settings,
      },
    ],
  },
];
export const pages: NavigationItem[] = [
  ...groups.flatMap((group) => group.items),
  {
    id: "tasks",
    title: "Fristående uppdrag",
    description:
      "Befintliga uppdrag är bevarade. Projektkoppling läggs till i Fas 2.",
    icon: FolderKanban,
  },
];
