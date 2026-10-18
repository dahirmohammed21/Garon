export type TaskStatus =
  "pending" | "running" | "done" | "cancelled" | "approval";
export type Task = {
  businessId?: string | null;
  projectId?: string | null;
  id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
  status: TaskStatus;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type Agent = {
  manager?: "openai" | "anthropic";
  instruction?: string;
  businessIds?: string[];
  tools?: string[];
  id: string;
  name: string;
  role: string;
  enabled: boolean;
  createdAt: string;
};
export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};
export type Activity = {
  id: string;
  title: string;
  detail: string;
  type: "info" | "success" | "warning";
  createdAt: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
export type Usage = {
  id: string;
  createdAt: string;
  model: string;
  cost: number;
  estimated: boolean;
  inputTokens: number;
  outputTokens: number;
};
export type State = {
  v4: V4State;
  businesses: Business[];
  tasks: Task[];
  agents: Agent[];
  notes: Note[];
  activity: Activity[];
  messages: Message[];
  usage: Usage[];
  settings: { name: string; budget: number };
  ai: {
    providers: {
      id: string;
      name: string;
      configured: boolean;
      model: string;
    }[];
    enabled: boolean;
    configured: boolean;
    provider: string | null;
    model: string | null;
    pricingSupported: boolean;
    spent: number;
    busy: boolean;
  };
};
export type Channel = "garon" | "openai" | "anthropic";
export type MemoryItem = {
  id: string;
  title: string;
  content: string;
  visibility: "private" | "shared";
  source: string;
  verified: boolean;
  businessId: string | null;
  createdAt: string;
};
export type Approval = {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  businessId: string | null;
  risk: string;
  estimatedCost: number | null;
  status: string;
  createdAt: string;
  action: { type: string; resourceId?: string };
};
export type Schedule = {
  id: string;
  title: string;
  type: "reminder" | "task";
  dueAt: string;
  status: string;
};
export type V4State = {
  system: { dataFile: string; version: string; scheduler: string };
  ui: {
    layout: WidgetLayout[];
    preferences: {
      theme: "dark" | "light";
      accent: string;
      density: "normal" | "compact";
      confirmations: boolean;
    };
  };
  ai: {
    enabled: boolean;
    garonProvider: Channel;
    models: Record<string, string>;
    busy: boolean;
    spent: number;
    providers: {
      id: Channel;
      name: string;
      model: string;
      configured: boolean;
      price: number[] | null;
    }[];
  };
  chats: Record<Channel, Message[]>;
  drafts: { id: string; channel: Channel; content: string }[];
  memory: MemoryItem[];
  approvals: Approval[];
  schedules: Schedule[];
  inbox: {
    id: string;
    title: string;
    content: string;
    source: string;
    read: boolean;
    createdAt: string;
  }[];
  delegations: {
    id: string;
    prompt: string;
    manager: Channel;
    status: string;
    result?: string;
    approvalId: string;
    error?: string;
  }[];
  projects: {
    id: string;
    businessId: string;
    name: string;
    description: string;
  }[];
  connections: { id: string; verifiedAt: string }[];
};
export type WidgetLayout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type BusinessSection = { id: string; title: string; view: string };
export type Business = {
  plan?: {
    workAreas: string[];
    tasks: string[];
    agents: string[];
    template: string;
    visualStyle: string;
  };
  id: string;
  name: string;
  description: string;
  sections: BusinessSection[];
  createdAt: string;
  updatedAt: string;
};
export type Page =
  | "overview"
  | "businesses"
  | "projects"
  | "leadership"
  | "integrations"
  | "agents"
  | "tasks"
  | "activity"
  | "approvals"
  | "finance"
  | "chat"
  | "memory"
  | "settings";
