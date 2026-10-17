import { Activity, Search } from "lucide-react";

import { Empty } from "../../components/ui";
import { date } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function ActivityPage() {
  const { state, listQuery, setListQuery } = useWorkspace();
  const matches = (value: string) =>
    value.toLocaleLowerCase("sv").includes(listQuery.toLocaleLowerCase("sv"));
  return (
    <>
      <div className="list-toolbar">
        <div className="filter-tabs">
          <span className="tab-label">
            {state.activity.length} senaste händelserna
          </span>
        </div>
        <div className="inline-search">
          <Search size={15} />
          <input
            aria-label="Sök i aktivitetslogg"
            placeholder="Sök i aktivitetsloggen…"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
          />
        </div>
      </div>
      <section className="panel full-timeline">
        {state.activity.filter((event) =>
          matches(`${event.title} ${event.detail}`),
        ).length ? (
          state.activity
            .filter((event) => matches(`${event.title} ${event.detail}`))
            .map((event) => (
              <div key={event.id} className={`timeline-item ${event.type}`}>
                <span className="timeline-dot" />
                <span className="event-icon">
                  <Activity size={17} />
                </span>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.detail}</p>
                </div>
                <time>{date(event.createdAt, true)}</time>
              </div>
            ))
        ) : (
          <Empty
            icon={Activity}
            title="Här får ditt arbete en historia"
            detail={
              listQuery
                ? "Inga händelser matchar sökningen."
                : "Skapa ett uppdrag eller spara ett minne för att komma igång."
            }
          />
        )}
      </section>
    </>
  );
}
