import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";

interface Props {
  value: string[]; // ISO date strings (YYYY-MM-DD)
  onChange: (next: string[]) => void;
}

// Lightweight availability date picker. Stores ISO YYYY-MM-DD strings.
// Replaces the old free-text "booking note" field in ArtistSettings.
export default function AvailabilityCalendar({ value, onChange }: Props) {
  const [dateInput, setDateInput] = useState("");
  const sorted = [...value].sort();

  const add = () => {
    if (!dateInput) return;
    if (sorted.includes(dateInput)) return;
    onChange([...sorted, dateInput]);
    setDateInput("");
  };

  const remove = (d: string) => onChange(sorted.filter(x => x !== d));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Available dates</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Add specific dates fans can request bookings on. Leave empty to let fans request any date.
      </p>
      <div className="flex gap-2">
        <input
          type="date"
          min={today}
          value={dateInput}
          onChange={e => setDateInput(e.target.value)}
          className="flex-1 bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={add}
          disabled={!dateInput}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No dates added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map(d => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/20 text-primary"
            >
              {new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              <button type="button" onClick={() => remove(d)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
