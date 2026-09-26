import { useEffect, useState } from "react";
import { formatNL, parseNL } from "@bitewise/domain";
import { del, get, post, put, todayStr, type Goals, type Me } from "../api";

function Veld({ label, waarde, set, eenheid }: { label: string; waarde: string; set: (v: string) => void; eenheid: string }) {
  return (
    <label>
      {label} ({eenheid}, leeg = geen doel)
      <input inputMode="decimal" value={waarde} onChange={(e) => set(e.target.value)} />
    </label>
  );
}

const str = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

export function Health({ me, onChanged }: { me: Me; onChanged: () => void }) {
  const [kcal, setKcal] = useState(str(me.goals.kcal));
  const [eiwit, setEiwit] = useState(str(me.goals.protein));
  const [kh, setKh] = useState(str(me.goals.carbs));
  const [vet, setVet] = useState(str(me.goals.fat));
  const [waterDoel, setWaterDoel] = useState(str(me.goals.waterMl));
  const [streef, setStreef] = useState(str(me.goals.weightKg));
  const [waterMl, setWaterMl] = useState("");
  const [waterTotaal, setWaterTotaal] = useState<number | null>(null);
  const [waterRegels, setWaterRegels] = useState<{ id: string; ml: number }[]>([]);
  const [gewicht, setGewicht] = useState("");
  const [historie, setHistorie] = useState<{ date: string; kg: number }[]>([]);
  const [doelen, setDoelen] = useState<Goals>(me.goals);
  const [fout, setFout] = useState("");
  const [melding, setMelding] = useState("");

  const laad = async () => {
    try {
      const [w, h] = await Promise.all([
        get<{ totalMl: number; entries: { id: string; ml: number }[] }>(`/api/water?date=${todayStr()}`),
        get<{ entries: { date: string; kg: number }[] }>("/api/weight?from=2000-01-01"),
      ]);
      setWaterTotaal(w.totalMl);
      setWaterRegels(w.entries);
      setHistorie(h.entries.slice(-14).reverse());
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Laden mislukt.");
    }
  };

  useEffect(() => {
    void laad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bewaarDoelen = async () => {
    setFout("");
    setMelding("");
    try {
      const g = await put<{ goals: Goals }>("/api/goals", {
        kcal: parseNL(kcal),
        protein: parseNL(eiwit),
        carbs: parseNL(kh),
        fat: parseNL(vet),
        waterMl: parseNL(waterDoel),
        weightKg: parseNL(streef),
      });
      setDoelen(g.goals);
      setMelding("Doelen bewaard.");
      onChanged();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Bewaren mislukt.");
    }
  };

  const voegWaterToe = async () => {
    const ml = Math.round(Number(waterMl.replace(",", ".")));
    if (!Number.isFinite(ml) || ml <= 0 || ml > 2000) {
      setFout("Vul milliliters in (1–2000).");
      return;
    }
    try {
      await post("/api/water", { date: todayStr(), ml });
      setWaterMl("");
      await laad();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Toevoegen mislukt.");
    }
  };

  const bewaarGewicht = async () => {
    const kg = parseNL(gewicht);
    if (kg === null || kg <= 0 || kg > 500) {
      setFout("Vul een geldig gewicht in kg in (komma mag).");
      return;
    }
    try {
      await put("/api/weight", { date: todayStr(), kg });
      setGewicht("");
      setMelding("Gewicht bewaard (alleen gewicht — geen overige metingen in Fase 1).");
      await laad();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Bewaren mislukt.");
    }
  };

  return (
    <section aria-label="Gezondheid">
      <h1>Gezondheid</h1>
      {fout && <p role="alert" className="error">{fout}</p>}
      {melding && <p className="ok">{melding}</p>}

      <div className="card">
        <h2>Doelen</h2>
        <Veld label="Energie" eenheid="kcal" waarde={kcal} set={setKcal} />
        <div className="row">
          <Veld label="Eiwit" eenheid="g" waarde={eiwit} set={setEiwit} />
          <Veld label="Koolhydraten" eenheid="g" waarde={kh} set={setKh} />
        </div>
        <div className="row">
          <Veld label="Vet" eenheid="g" waarde={vet} set={setVet} />
          <Veld label="Water" eenheid="ml" waarde={waterDoel} set={setWaterDoel} />
        </div>
        <Veld label="Streefgewicht" eenheid="kg" waarde={streef} set={setStreef} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="primary" onClick={() => void bewaarDoelen()}>Doelen bewaren</button>
        </div>
      </div>

      <div className="card">
        <h2>Water — vandaag ({waterTotaal ?? "…"} ml{doelen.waterMl ? ` / doel ${formatNL(doelen.waterMl, 0)} ml` : ""})</h2>
        <div className="row">
          <input inputMode="numeric" placeholder="ml" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} aria-label="Milliliter water" />
          <button onClick={() => void voegWaterToe()}>+ Toevoegen</button>
        </div>
        <ul>
          {waterRegels.map((w) => (
            <li key={w.id}>
              {w.ml} ml{" "}
              <button
                onClick={async () => {
                  await del(`/api/water/${w.id}`);
                  await laad();
                }}
              >
                Wis
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Gewicht</h2>
        <div className="row">
          <input inputMode="decimal" placeholder="kg, bijv. 82,5" value={gewicht} onChange={(e) => setGewicht(e.target.value)} aria-label="Gewicht in kg" />
          <button onClick={() => void bewaarGewicht()}>Vandaag bewaren</button>
        </div>
        <ul>
          {historie.map((h) => (
            <li key={h.date}>{new Date(`${h.date}T00:00:00`).toLocaleDateString("nl-NL")} — {formatNL(h.kg)} kg</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
