import { useMemo, useState } from "react";
import { formatNL, scaleMacros } from "@bitewise/domain";

type Tab = "dagboek" | "eten" | "inzicht" | "gezondheid" | "meer";
type Meal = "ontbijt" | "lunch" | "diner" | "snack";

const DEMO_PRODUCT = {
  id: "demo-havermout",
  naam: "Havermout (demo)",
  merk: "Demo-merk",
  per100g: { kcal: 389, protein: 13.5, carbs: 66.3, fat: 6.5 },
};

export function App() {
  const [tab, setTab] = useState<Tab>("dagboek");
  const [etenStap, setEtenStap] = useState<"hub" | "detail" | "check">("hub");
  const [maaltijd, setMaaltijd] = useState<Meal>("ontbijt");
  const [gram, setGram] = useState(40);
  const [toegevoegd, setToegevoegd] = useState<{ maaltijd: Meal; gram: number }[]>([]);
  const [thema, setThema] = useState<"auto" | "licht" | "donker">("auto");

  const herberekend = useMemo(() => scaleMacros(DEMO_PRODUCT.per100g, gram), [gram]);
  const totaalKcal = toegevoegd.reduce(
    (s, r) => s + scaleMacros(DEMO_PRODUCT.per100g, r.gram).kcal,
    0,
  );

  return (
    <>
      <header className="topbar">
        <strong>BiteWise 2.0</strong>
        <span className="demo-badge">demo-data · geen echte logs</span>
      </header>
      <main>
        {tab === "dagboek" && (
          <section aria-label="Dagboek">
            <h1>Dagboek — vandaag</h1>
            <div className="card">
              <div className="muted">Resterend (demo-doel 2200 kcal)</div>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>
                {formatNL(2200 - totaalKcal, 0)} kcal
              </div>
              <div className="macros">
                <div>Eiwit<div>{formatNL(herberekend.protein ?? 0)} g</div></div>
                <div>Koolh.<div>{formatNL(herberekend.carbs ?? 0)} g</div></div>
                <div>Vet<div>{formatNL(herberekend.fat ?? 0)} g</div></div>
              </div>
              <p className="muted">Water: 3/8 glazen (demo) · Gewicht: — (demo)</p>
            </div>
            {(["ontbijt", "lunch", "diner", "snack"] as Meal[]).map((m) => (
              <div className="card" key={m}>
                <strong style={{ textTransform: "capitalize" }}>{m}</strong>
                <div className="muted">
                  {toegevoegd.filter((r) => r.maaltijd === m).length} regels (demo)
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button
                    onClick={() => {
                      setMaaltijd(m);
                      setEtenStap("hub");
                      setTab("eten");
                    }}
                  >
                    Voeg toe
                  </button>
                </div>
              </div>
            ))}
            {toegevoegd.length > 0 && (
              <div className="card">
                <strong>Toegevoegd in deze demo-sessie</strong>
                <ul>
                  {toegevoegd.map((r, i) => (
                    <li key={i}>
                      {r.maaltijd} — {r.gram} g ({formatNL(scaleMacros(DEMO_PRODUCT.per100g, r.gram).kcal, 0)} kcal)
                    </li>
                  ))}
                </ul>
                <button onClick={() => setToegevoegd([])}>Wis demo-sessie</button>
              </div>
            )}
          </section>
        )}

        {tab === "eten" && (
          <section aria-label="Eten">
            <h1>Eten (F0)</h1>
            {etenStap === "hub" && (
              <div className="card">
                <label>
                  Zoek demo-product
                  <input defaultValue="havermout" aria-label="Zoek demo-product" />
                </label>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="primary" onClick={() => setEtenStap("detail")}>
                    Zoek · demo
                  </button>
                  <button onClick={() => setEtenStap("detail")}>Scan (demo)</button>
                  <button onClick={() => setEtenStap("detail")}>Foto (demo)</button>
                </div>
                <p className="muted">Recent/Favoriet/Opgeslagen/Recepten: demo-lijst, 1 item.</p>
                <button onClick={() => setEtenStap("detail")}>
                  {DEMO_PRODUCT.naam} — open detail (F2)
                </button>
              </div>
            )}
            {etenStap === "detail" && (
              <div className="card">
                <h2>{DEMO_PRODUCT.naam} (F2)</h2>
                <p className="muted">
                  {DEMO_PRODUCT.merk} · per 100 g · herkomst: demo · ontbrekend: — (geen nul)
                </p>
                <div className="row">
                  <button className="primary" onClick={() => setEtenStap("check")}>
                    Portie controleren (F5)
                  </button>
                  <button onClick={() => setEtenStap("hub")}>Terug</button>
                </div>
              </div>
            )}
            {etenStap === "check" && (
              <div className="card">
                <h2>Portie controleren (F5)</h2>
                <div className="row">
                  <label>
                    Dag + maaltijd
                    <select
                      value={maaltijd}
                      onChange={(e) => setMaaltijd(e.target.value as Meal)}
                    >
                      <option value="ontbijt">Vandaag · ontbijt</option>
                      <option value="lunch">Vandaag · lunch</option>
                      <option value="diner">Vandaag · diner</option>
                      <option value="snack">Vandaag · snack</option>
                    </select>
                  </label>
                  <label>
                    Hoeveelheid (gram)
                    <input
                      type="number"
                      min={1}
                      value={gram}
                      onChange={(e) => setGram(Number(e.target.value) || 0)}
                    />
                  </label>
                </div>
                <p>
                  {gram} g → {formatNL(herberekend.kcal, 0)} kcal · E{" "}
                  {herberekend.protein === null ? "—" : formatNL(herberekend.protein)} · K{" "}
                  {herberekend.carbs === null ? "—" : formatNL(herberekend.carbs)} · V{" "}
                  {herberekend.fat === null ? "—" : formatNL(herberekend.fat)}
                </p>
                <div className="row">
                  <button
                    className="primary"
                    onClick={() => {
                      setToegevoegd((v) => [...v, { maaltijd, gram }]);
                      setTab("dagboek");
                      setEtenStap("hub");
                    }}
                  >
                    Toevoegen aan {maaltijd}
                  </button>
                  <button onClick={() => setEtenStap("detail")}>Terug</button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "inzicht" && (
          <section aria-label="Inzicht">
            <h1>Inzicht (demo)</h1>
            <div className="card">
              <label>
                Periode
                <select>
                  <option>7 dagen</option>
                  <option>30 dagen</option>
                </select>
              </label>
              <p>Nog geen betrouwbare conclusie — te weinig demo-data.</p>
            </div>
          </section>
        )}

        {tab === "gezondheid" && (
          <section aria-label="Gezondheid">
            <h1>Gezondheid (demo)</h1>
            <div className="card">
              <p className="muted">
                Geen koppeling. Slaap/herstel/activiteit alleen bij voldoende betrouwbare
                gegevens.
              </p>
              <button>Koppeling instellen (demo, geen echte sync)</button>
            </div>
          </section>
        )}

        {tab === "meer" && (
          <section aria-label="Meer">
            <h1>Meer</h1>
            <div className="card">
              <div className="row">
                {["Doelen", "Vrienden", "AI-assistent", "Herinneringen", "Instellingen & privacy"].map(
                  (x) => (
                    <button key={x}>{x} (demo)</button>
                  ),
                )}
              </div>
              <p className="muted" style={{ marginTop: 12 }}>
                Thema:
                <span className="row" style={{ marginTop: 6 }}>
                  {(["auto", "licht", "donker"] as const).map((t) => (
                    <button
                      key={t}
                      aria-pressed={thema === t}
                      onClick={() => {
                        setThema(t);
                        document.documentElement.style.colorScheme = t === "auto" ? "light dark" : t === "licht" ? "light" : "dark";
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </span>
              </p>
            </div>
          </section>
        )}
      </main>
      <nav className="dock" aria-label="Hoofd navigatie">
        {(["dagboek", "eten", "inzicht", "gezondheid", "meer"] as Tab[]).map((t) => (
          <button
            key={t}
            aria-current={tab === t ? "page" : undefined}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
    </>
  );
}
