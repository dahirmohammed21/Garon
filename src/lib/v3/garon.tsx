import { createContext, useContext } from "react";
import type { Business, State } from "../../types";
import type { Route } from "./navigation";
export type GaronContext = {
  state: State;
  route: Route;
  go: (route: Route) => void;
  busy: boolean;
  mutate: (
    path: string,
    body: unknown,
    method?: string,
    message?: string,
  ) => Promise<boolean>;
  newBusiness: () => void;
  editBusiness: (business: Business) => void;
  deleteBusiness: (business: Business) => Promise<void>;
};
const Context = createContext<GaronContext | null>(null);
export const GaronProvider = Context.Provider;
export function useGaron() {
  const value = useContext(Context);
  if (!value) throw new Error("Arbetsytan är inte tillgänglig.");
  return value;
}
