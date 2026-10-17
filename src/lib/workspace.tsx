import {
  createContext,
  useContext,
  type Dispatch,
  type FormEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import type { Page, State, Task } from "../types";
export type Modal = "task" | "agent" | "note" | Task | null;
type Setter<T> = Dispatch<SetStateAction<T>>;
type Workspace = {
  state: State;
  page: Page;
  collapsed: boolean;
  mobileOpen: boolean;
  toggleSidebar: () => void;
  go: (page: Page) => void;
  busy: boolean;
  mutate: (
    path: string,
    body?: unknown,
    method?: string,
    message?: string,
  ) => Promise<boolean | undefined>;
  modal: Modal;
  setModal: Setter<Modal>;
  modalRef: RefObject<HTMLDivElement | null>;
  listQuery: string;
  setListQuery: Setter<string>;
  taskFilter: string;
  setTaskFilter: Setter<string>;
  draft: string;
  setDraft: Setter<string>;
  sending: boolean;
  sendChat: (event: FormEvent) => Promise<void>;
  chatEnd: RefObject<HTMLDivElement | null>;
  demo: boolean;
  setDemo: Setter<boolean>;
  lastVisit: string | null;
};
const Context = createContext<Workspace | null>(null);
export const WorkspaceProvider = Context.Provider;
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Arbetsytan är inte tillgänglig.");
  return value;
}
