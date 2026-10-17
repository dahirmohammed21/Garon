import {
  Activity,
  ArrowRight,
  Shield,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";

import { Empty, SectionTitle } from "../../components/ui";
import { money, date } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function FinancePage() {
  const { state, go } = useWorkspace();
  return (
    <>
      <div className="finance-cards">
        <section className="panel finance-stat">
          <span className="icon-box">
            <Wallet size={20} />
          </span>
          <p>Registrerad AI-kostnad denna månad</p>
          <h2>{money(state.ai.spent)}</h2>
          <small>Beräknad från tokenanvändning och modellpris</small>
        </section>
        <section className="panel finance-stat">
          <span className="icon-box green">
            <Shield size={20} />
          </span>
          <p>Månadsbudget</p>
          <h2>{money(state.settings.budget)}</h2>
          <small>Ny månad räknas från UTC</small>
        </section>
        <section className="panel finance-stat">
          <span className="icon-box purple">
            <Zap size={20} />
          </span>
          <p>Återstående utrymme</p>
          <h2>{money(Math.max(0, state.settings.budget - state.ai.spent))}</h2>
          <small>Budgeten kontrolleras före varje AI-anrop</small>
        </section>
      </div>
      <section className="panel budget-panel">
        <SectionTitle
          icon={ShieldCheck}
          title="Din budgetgräns"
          description="En lokal spärr för AI-chatten i den här installationen."
          action={
            <button className="text-button" onClick={() => go("settings")}>
              Justera budget <ArrowRight size={14} />
            </button>
          }
        />
        <div className="budget-track">
          <span
            style={{
              width: `${state.settings.budget ? Math.min(100, (state.ai.spent / state.settings.budget) * 100) : 0}%`,
            }}
          />
        </div>
        <div className="budget-labels">
          <span>{money(state.ai.spent)} registrerat</span>
          <span>{money(state.settings.budget)} budget</span>
        </div>
        <p className="fine-print">
          Kostnaderna är beräknade, inte en faktura. Osäkra anrop behåller en
          konservativ reservation. Leverantörens priser kan ändras; sätt även en
          gräns hos leverantören.
        </p>
      </section>
      <section className="panel usage-panel">
        <SectionTitle
          icon={Activity}
          title="AI-användning"
          description="Endast anrop från den här GARON-installationen visas."
        />
        {state.usage.length ? (
          <div className="usage-table">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Modell</th>
                  <th>Token in / ut</th>
                  <th>Kostnad</th>
                </tr>
              </thead>
              <tbody>
                {state.usage.map((item) => (
                  <tr key={item.id}>
                    <td>{date(item.createdAt, true)}</td>
                    <td>{item.model}</td>
                    <td>
                      {item.inputTokens} / {item.outputTokens}
                    </td>
                    <td>
                      {money(item.cost)}
                      {item.estimated && <small>Reservation</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={Wallet}
            title="Inga AI-kostnader ännu"
            detail="När du använder en ansluten AI-modell visas anrop och beräknad kostnad här."
          />
        )}
      </section>
    </>
  );
}
