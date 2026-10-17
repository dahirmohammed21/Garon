import { BookOpen, FileText, Plus, Search, Trash2 } from "lucide-react";

import { Empty } from "../../components/ui";
import { date } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function MemoryPage() {
  const { state, mutate, setModal, listQuery, setListQuery } =
    useWorkspace();
  const matches = (value: string) =>
    value.toLocaleLowerCase("sv").includes(listQuery.toLocaleLowerCase("sv"));
  return (
    <>
      <div className="notice">
        <BookOpen size={16} />
        Befintliga anteckningar är bevarade som global kunskap. Koppling till verksamheter och projekt kommer senare. Inget skickas till AI i Fas 1.
      </div>
      <div className="inline-search standalone-search">
        <Search size={16} />
        <input
          aria-label="Sök i minnet"
          placeholder="Sök i din kunskap…"
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
        />
      </div>
      {state.notes.length ? (
        <div className="notes-grid">
          {state.notes
            .filter((note) => matches(`${note.title} ${note.content}`))
            .map((note) => (
              <article className="panel note-card" key={note.id}>
                <div>
                  <span className="icon-box">
                    <FileText size={18} />
                  </span>
                  <button
                    className="icon-button danger-hover"
                    aria-label={`Ta bort ${note.title}`}
                    onClick={() => {
                      if (confirm(`Ta bort minnet ”${note.title}”?`))
                        mutate(
                          `/notes/${note.id}`,
                          {},
                          "DELETE",
                          "Minnet är borttaget",
                        );
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h2>{note.title}</h2>
                <p>{note.content}</p>
                <time>{date(note.createdAt, true)}</time>
              </article>
            ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            icon={BookOpen}
            title="Bygg din egen kunskapsbas"
            detail="Spara idéer, projektinformation och sådant du vill komma ihåg. Allt finns kvar nästa gång du öppnar GARON."
            action={
              <button
                className="button primary"
                onClick={() => setModal("note")}
              >
                <Plus size={16} />
                Spara ditt första minne
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
