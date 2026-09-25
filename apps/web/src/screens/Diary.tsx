import { useCallback, useEffect, useState } from "react";
import { formatNL, parseNL } from "@bitewise/domain";
import {
  addDays,
  del,
  enqueue,
  fmtDate,
  get,
  isOfflineError,
  loadOutbox,
  patch,
  post,
  put,
  syncOutbox,
  todayStr,
  type DayData,
  type DiaryEntry,
  type Macros,
} from "../api";

function macroLijn(m: Macros): string {
  const s = (v: number | null, e: string) => (v === null ? `— ${e}` : `${formatNL(v)} g ${e}`);
  return `${formatNL(m.kcal, 0)} kcal · ${s(m.protein, "eiwit")} · ${s(m.carbs, "kh")} · ${s(m.fat, "vet")}`;
}

export function Diary({ date, setDate, refreshSignal, onChanged }: { date: string; setDate: (date: string | ((previous: string) => string)) => void; refreshSignal: number; onChanged: () => void }) {
  const [dag, setDag] = useState<DayData | null>(null);
  const [fout, setFout] = useState("");
  const [melding, setMelding] = useState("");
  const [waterInvoer, setWaterInvoer] = useState("");
  const [notitie, setNotitie] = useState("");
  const [bewerk, setBewerk] = useState<{ id: string; grams: string; status: "gegeten" | "gepland" } | null>(null);
  const [offlineRij, setOfflineRij] = useState(0);

  const laad = useCallback(async () => {
    setFout("");
    try {
      const d = await get<DayData>(`/api/diary?date=${date}`);
      setDag(d);
      setNotitie(d.note);
      setOfflineRij(loadOutbox().length);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Laden mislukt.");
    }
  }, [date]);

  useEffect(() => {
    void laad();
  }, [laad, refreshSignal]);

  useEffect(() => {
    // Bij terug online: outbox legen.
    const online = () => {
      void syncOutbox().then((r) => {
        if (r.done > 0) setMelding(`${r.done} offline-regel(s) gesynchroniseerd.`);
        if (r.conflicts > 0) setMelding("Er is een conflict — los het op bij Meer → Offline.");
        setOfflineRij(loadOutbox().length);
        void laad();
        onChanged();
      });
    };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [laad, onChanged]);

  const verzendMutatie = async (fn: () => Promise<unknown>, fallback: { kind: "diary-create" | "diary-patch"; payload: Record<string, unknown>; entryId?: string }) => {
    try {
      await fn();
      setMelding("");
      await laad();
      onChanged();
    } catch (e) {
      if (isOfflineError(e) || (e instanceof TypeError)) {
        enqueue(fallback);
        setOfflineRij(loadOutbox().length);
        setMelding("Offline opgeslagen — wordt verzonden zodra je weer online bent.");
        await laad().catch(() => undefined);
      } else {
        setFout(e instanceof Error ? e.message : "Mislukt.");
      }
    }
  };

  const bewaarNotitie = async () => {
    try {
      await put("/api/notes", { date, note: notitie });
      setMelding("Notitie bewaard.");
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Bewaren mislukt.");
    }
  };

  const voegWaterToe = async () => {
    const ml = Math.round(Number(waterInvoer));
    if (!Number.isFinite(ml) || ml <= 0 || ml > 2000) {
      setFout("Vul een hoeveelheid in milliliters in (1–2000).");
      return;
    }
    try {
      await post("/api/water", { date, ml });
      setWaterInvoer("");
      await laad();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Water toevoegen mislukt.");
    }
  };

  const hergebruikGisteren = async () => {
    if (!window.confirm("Gisteren opnieuw overnemen als plan voor deze dag? Er wordt niets automatisch als gegeten gemarkeerd.")) return;
    try {
      const r = await post<{ copied: number }>("/api/diary/copy-day", { from: addDays(date, -1), to: date });
      setMelding(r.copied === 0 ? "Gisteren stond niets in het dagboek." : `${r.copied} regel(s) als plan overgenomen.`);
      await laad();
      onChanged();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Overnemen mislukt.");
    }
  };

  const bewaarBewerking = async () => {
    if (!bewerk || !dag) return;
    const grams = parseNL(bewerk.grams);
    if (grams === null || grams <= 0) {
      setFout("Vul een geldig aantal gram in.");
      return;
    }
    const entry = dag.entries.find((x) => x.id === bewerk.id);
    if (!entry) return;
    const payload = { grams, status: bewerk.status, updatedAt: entry.updatedAt };
    await verzendMutatie(() => patch(`/api/diary/${bewerk.id}`, payload), {
      kind: "diary-patch",
      payload,
      entryId: bewerk.id,
    });
    setBewerk(null);
  };

  const verwijder = async (entry: DiaryEntry) => {
    if (!window.confirm(`“${entry.productName}” verwijderen uit ${entry.meal}?`)) return;
    try {
      await del(`/api/diary/${entry.id}`);
      await laad();
      onChanged();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Verwijderen mislukt.");
    }
  };

  const markeerGegeten = async (entry: DiaryEntry) => {
    const payload = { status: "gegeten", updatedAt: entry.updatedAt };
    await verzendMutatie(() => patch(`/api/diary/${entry.id}`, payload), {
      kind: "diary-patch",
      payload,
      entryId: entry.id,
    });
  };

  return (
    <section aria-label="Dagboek">
      <h1>Dagboek</h1>
      <div className="card">
        <div className="row">
          <button onClick={() => setDate((d) => addDays(d, -1))} aria-label="Vorige dag">‹</button>
          <input type="date" value={date} max={addDays(todayStr(), 7)} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Datum" />
          <button onClick={() => setDate((d) => addDays(d, 1))} aria-label="Volgende dag">›</button>
          {date !== todayStr() && <button onClick={() => setDate(todayStr())}>Vandaag</button>}
        </div>
        <div className="muted">{fmtDate(date)}</div>
      </div>

      {fout && <p role="alert" className="error">{fout}</p>}
      {melding && <p className="ok">{melding}</p>}
      {offlineRij > 0 && <p className="muted">Nog {offlineRij} offline-regel(s) te verzenden.</p>}

      {dag && (
        <>
          <div className="card">
            <div className="muted">Totaal gegeten</div>
            <div className="groot">{macroLijn(dag.totals)}</div>
            {dag.planned.kcal > 0 && <div className="muted">Gepland (nog niet gegeten): {macroLijn(dag.planned)}</div>}
            <div className="muted">Water: {dag.waterMl} ml · Gewicht: {dag.weightKg === null ? "—" : `${formatNL(dag.weightKg)} kg`}</div>
          </div>

          {dag.meals.map((meal) => {
            const regels = dag.entries.filter((e) => e.meal === meal.id);
            return (
              <div className="card" key={meal.id}>
                <strong>{meal.label}</strong>
                {regels.length === 0 && <div className="muted">Nog niets.</div>}
                <ul className="regels">
                  {regels.map((e) => (
                    <li key={e.id}>
                      <div>
                        <div>
                          {e.productName} — {formatNL(e.grams, 0)} g
                          {e.status === "gepland" && <span className="badge">gepland</span>}
                        </div>
                        <div className="muted">{macroLijn(e.macros)}{e.note ? ` · “${e.note}”` : ""}</div>
                      </div>
                      <div className="row">
                        {e.status === "gepland" && <button onClick={() => void markeerGegeten(e)}>Gegeten ✓</button>}
                        <button onClick={() => setBewerk({ id: e.id, grams: String(e.grams).replace(".", ","), status: e.status })}>Bewerk</button>
                        <button onClick={() => void verwijder(e)}>Wis</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {bewerk && (
            <div className="card" role="dialog" aria-label="Regel bewerken">
              <h2>Regel bewerken</h2>
              <label>
                Gram
                <input inputMode="decimal" value={bewerk.grams} onChange={(e) => setBewerk({ ...bewerk, grams: e.target.value })} />
              </label>
              <label>
                Status
                <select value={bewerk.status} onChange={(e) => setBewerk({ ...bewerk, status: e.target.value as "gegeten" | "gepland" })}>
                  <option value="gegeten">Gegeten</option>
                  <option value="gepland">Gepland</option>
                </select>
              </label>
              <div className="row">
                <button className="primary" onClick={() => void bewaarBewerking()}>Bewaren</button>
                <button onClick={() => setBewerk(null)}>Annuleren</button>
              </div>
            </div>
          )}

          <div className="card">
            <h2>Water</h2>
            <div className="row">
              <input inputMode="numeric" placeholder="ml, bijv. 250" value={waterInvoer} onChange={(e) => setWaterInvoer(e.target.value)} aria-label="Milliliter water" />
              <button onClick={() => void voegWaterToe()}>+ Toevoegen</button>
            </div>
          </div>

          <div className="card">
            <h2>Dagnotitie</h2>
            <textarea rows={2} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Hoe ging de dag?" aria-label="Dagnotitie" />
            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={() => void bewaarNotitie()}>Bewaar notitie</button>
              <button onClick={() => void hergebruikGisteren()}>Gisteren opnieuw (als plan)</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
