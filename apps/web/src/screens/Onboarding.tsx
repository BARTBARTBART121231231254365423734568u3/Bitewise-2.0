import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseNL } from "@bitewise/domain";
import { post } from "../api";

function Num({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label>
      {label}
      <input inputMode="decimal" placeholder="leeg = geen doel" value={value} onChange={(e) => set(e.target.value)} />
    </label>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const nav = useNavigate();
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fout, setFout] = useState("");

  return (
    <section aria-label="Onboarding">
      <h1>Goed dat je er bent</h1>
      <div className="card">
        <p className="muted">
          Stel hier je startvoorstel in. Alles mag leeg blijven — je kunt het later altijd aanpassen bij Gezondheid.
          Getallen mogen met een komma (bijv. 82,5).
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setFout("");
            try {
              await post("/api/onboarding", {
                kcal: parseNL(kcal),
                protein: parseNL(protein),
                carbs: parseNL(carbs),
                fat: parseNL(fat),
              });
              onDone();
              nav("/");
            } catch {
              setFout("Opslaan mislukt. Controleer je verbinding.");
            }
          }}
        >
          <Num label="Dagdoel energie (kcal)" value={kcal} set={setKcal} />
          <Num label="Eiwitdoel (g)" value={protein} set={setProtein} />
          <Num label="Koolhydraatdoel (g)" value={carbs} set={setCarbs} />
          <Num label="Vetdoel (g)" value={fat} set={setFat} />
          {fout && <p role="alert" className="error">{fout}</p>}
          <div className="row">
            <button className="primary" type="submit">Aan de slag</button>
          </div>
        </form>
      </div>
    </section>
  );
}
