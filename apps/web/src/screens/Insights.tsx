import { useEffect, useState } from "react";
import { formatNL } from "@bitewise/domain";
import { addDays, get, todayStr } from "../api";

interface Trend { date: string; kcal: number | null; weightKg: number | null }
interface TrendResp { from: string; to: string; points: Trend[]; conclusionOk: boolean; conclusion: string; kcalGoal: number | null }

export function Insights() {
  const [to, setTo] = useState(todayStr());
  const [days, setDays] = useState("14");
  const [data, setData] = useState<TrendResp | null>(null);
  const [fout, setFout] = useState("");

  const laad = async () => {
    setFout("");
    const n = Math.min(90, Math.max(2, Number(days) || 14));
    const from = addDays(to, -(n - 1));
    try {
      setData(await get<TrendResp>(`/api/insights/trend?from=${from}&to=${to}`));
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Laden mislukt.");
    }
  };

  useEffect(() => {
    void laad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const max = Math.max(1, ...(data?.points.map((p) => p.kcal ?? 0) ?? [1]));
  const metKcal = data?.points.filter((p) => p.kcal !== null) ?? [];
  const gem = metKcal.length > 0 ? metKcal.reduce((s, p) => s + (p.kcal as number), 0) / metKcal.length : null;

  return (
    <section aria-label="Inzicht">
      <h1>Inzicht</h1>
      <div className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void laad();
          }}
        >
          <div className="row">
            <label>
              T/m
              <input type="date" value={to} max={todayStr()} onChange={(e) => e.target.value && setTo(e.target.value)} />
            </label>
            <label>
              Dagen
              <select value={days} onChange={(e) => setDays(e.target.value)}>
                <option value="7">7 dagen</option>
                <option value="14">14 dagen</option>
                <option value="30">30 dagen</option>
              </select>
            </label>
            <button className="primary" type="submit">Toon</button>
          </div>
        </form>
      </div>
      {fout && <p role="alert" className="error">{fout}</p>}
      {data && (
        <>
          <div className={`card ${data.conclusionOk ? "" : "warn"}`}>
            <strong>{data.conclusionOk ? "Conclusie" : "Nog geen conclusie"}</strong>
            <p className="muted">{data.conclusion}</p>
            {gem !== null && <p>Gemiddeld: {formatNL(gem, 0)} kcal/dag over {metKcal.length} {metKcal.length === 1 ? "dag" : "dagen"}{data.kcalGoal ? ` · doel: ${formatNL(data.kcalGoal, 0)} kcal` : ""}</p>}
          </div>
          <div className="card">
            <h2>Energie per dag</h2>
            <ul className="trend">
              {data.points.map((p) => (
                <li key={p.date}>
                  <span className="muted">{new Date(`${p.date}T00:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "numeric" })}</span>
                  <span className="balk"><span style={{ width: `${((p.kcal ?? 0) / max) * 100}%` }} /></span>
                  <span>{p.kcal === null ? "—" : `${formatNL(p.kcal, 0)}`}{p.weightKg !== null ? ` · ${formatNL(p.weightKg)} kg` : ""}</span>
                </li>
              ))}
            </ul>
            <p className="muted">— = geen data (nooit 0).</p>
          </div>
        </>
      )}
    </section>
  );
}
