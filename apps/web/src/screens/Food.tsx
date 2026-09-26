import { useEffect, useState } from "react";
import { formatNL, parseNL } from "@bitewise/domain";
import {
  del,
  enqueue,
  get,
  isOfflineError,
  post,
  put,
  type Macros,
  type MealMoment,
  type Product,
  type Recipe,
} from "../api";
import { newProductPayload } from "./food-input";

function macroKort(m: Macros): string {
  return `${formatNL(m.kcal, 0)} kcal`;
}

export function LogForm({ product, recepten, date, meals, onGelukt }: { product?: Product; recepten: Recipe[]; date: string; meals: MealMoment[]; onGelukt: () => void }) {
  const [soort, setSoort] = useState<"product" | "recept">("product");
  const [receptId, setReceptId] = useState(recepten[0]?.id ?? "");
  const [portie, setPortie] = useState(product?.portions.some((p) => p.label === product.lastPortionLabel) ? product.lastPortionLabel! : "");
  const [gram, setGram] = useState("100");
  const [aantal, setAantal] = useState("1");
  const [maaltijd, setMaaltijd] = useState(meals[0]?.id ?? "ontbijt");
  const [status, setStatus] = useState<"gegeten" | "gepland">("gegeten");
  const [fout, setFout] = useState("");
  const [ok, setOk] = useState("");

  const gekozenPortie = product?.portions.find((p) => p.label === portie);
  const gramOnbekend = gekozenPortie ? gekozenPortie.grams === null : false;

  const log = async () => {
    setFout("");
    setOk("");
    let g = parseNL(gram);
    if (soort === "product" && gekozenPortie && !gramOnbekend) {
      // Aantal porties × conversie (F3: direct herberekenen)
      const count = parseNL(aantal);
      if (count === null || count <= 0) {
        setFout("Vul een geldig aantal porties in.");
        return;
      }
      g = Math.round(gekozenPortie.grams! * count * 10) / 10;
    }
    if (g === null || g <= 0) {
      setFout(gramOnbekend ? "Van deze portie is geen conversie bekend — vul gram of ml in." : "Vul een geldig aantal gram in.");
      return;
    }
    const payload: Record<string, unknown> =
      soort === "product" && product
        ? { meal: maaltijd, productId: product.id, grams: g, status, ...(portie ? { portionLabel: portie } : {}) }
        : { meal: maaltijd, recipeId: receptId, grams: g, status };
    const metDatum = { date, ...payload };
    try {
      await post("/api/diary", metDatum);
      setOk(soort === "product" ? `${product?.name} gelogd (${formatNL(g, 0)} g).` : "Recept gelogd.");
      onGelukt();
    } catch (e) {
      if (isOfflineError(e) || e instanceof TypeError) {
        enqueue({ kind: "diary-create", payload: metDatum });
        setOk("Offline bewaard — wordt later verzonden.");
        onGelukt();
      } else {
        setFout(e instanceof Error ? e.message : "Loggen mislukt.");
      }
    }
  };

  return (
    <div className="card">
      <h2>Loggen</h2>
      {product && recepten.length > 0 && (
        <div className="row">
          <button className={soort === "product" ? "primary" : ""} onClick={() => setSoort("product")}>{product.name}</button>
          <button className={soort === "recept" ? "primary" : ""} onClick={() => setSoort("recept")}>Recept</button>
        </div>
      )}
      {soort === "product" && product ? (
        <>
          {product.portions.length > 0 && (
            <label>
              Portie (laatst: {product.lastPortionLabel ?? "—"})
              <select value={portie} onChange={(e) => setPortie(e.target.value)}>
                <option value="">Gram / ml invullen</option>
                {product.portions.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}{p.grams === null ? " (conversie onbekend)" : ` (${formatNL(p.grams, 0)} g)`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {gekozenPortie && !gramOnbekend ? "Aantal porties" : "Gram / ml"}
            <input inputMode="decimal" value={gekozenPortie && !gramOnbekend ? aantal : gram} onChange={(e) => (gekozenPortie && !gramOnbekend ? setAantal(e.target.value) : setGram(e.target.value))} placeholder={gramOnbekend ? "alleen gram/ml" : "bijv. 150 of 1,5"} />
          </label>
          {gekozenPortie?.grams !== null && gekozenPortie && parseNL(aantal) !== null && parseNL(aantal)! > 0 && (
            <p className="muted">{formatNL(gekozenPortie.grams * parseNL(aantal)!, 1)} g · {formatNL(product.per100g.kcal * gekozenPortie.grams * parseNL(aantal)! / 100, 0)} kcal</p>
          )}
        </>
      ) : (
        <label>
          Recept
          <select value={receptId} onChange={(e) => setReceptId(e.target.value)}>
            {recepten.map((r) => (
              <option key={r.id} value={r.id}>{r.name}{r.totals ? ` — ${macroKort(r.totals)} totaal` : ""}</option>
            ))}
          </select>
        </label>
      )}
      {soort === "recept" && (
        <label>
          Totaal gram (bereid gewicht)
          <input inputMode="decimal" value={gram} onChange={(e) => setGram(e.target.value)} />
        </label>
      )}
      <div className="row">
        <label>
          Moment
          <select value={maaltijd} onChange={(e) => setMaaltijd(e.target.value)}>
            {meals.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as "gegeten" | "gepland")}>
            <option value="gegeten">Gegeten</option>
            <option value="gepland">Gepland</option>
          </select>
        </label>
      </div>
      {fout && <p role="alert" className="error">{fout}</p>}
      {ok && <p className="ok">{ok}</p>}
      <div className="row">
        <button className="primary" onClick={() => void log()}>Toevoegen aan dagboek</button>
      </div>
    </div>
  );
}

export function Food({ date, meals, onChanged }: { date: string; meals: MealMoment[]; onChanged: () => void }) {
  const [q, setQ] = useState("");
  const [producten, setProducten] = useState<Product[]>([]);
  const [recepten, setRecepten] = useState<Recipe[]>([]);
  const [gekozen, setGekozen] = useState<Product | null>(null);
  const [toonNieuw, setToonNieuw] = useState(false);
  const [toonRecept, setToonRecept] = useState(false);
  const [fout, setFout] = useState("");

  const laad = async () => {
    try {
      const [p, r] = await Promise.all([
        get<{ products: Product[] }>(`/api/products?q=${encodeURIComponent(q)}`),
        get<{ recipes: Recipe[] }>("/api/recipes"),
      ]);
      setProducten(p.products ?? []);
      setRecepten(r.recipes ?? []);
      if (gekozen) setGekozen((p.products ?? []).find((x) => x.id === gekozen.id) ?? null);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Laden mislukt.");
    }
  };

  useEffect(() => {
    void laad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-label="Eten">
      <h1>Eten</h1>
      {fout && <p role="alert" className="error">{fout}</p>}
      <div className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void laad();
          }}
        >
          <label>
            Zoeken in eigen producten
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="naam of merk" aria-label="Zoeken in eigen producten" />
          </label>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="primary" type="submit">Zoek</button>
            <button type="button" onClick={() => setToonNieuw((v) => !v)}>Nieuw product</button>
            <button type="button" onClick={() => setToonRecept((v) => !v)}>Nieuw recept</button>
          </div>
        </form>
      </div>

      {toonNieuw && <NieuwProduct onKlaar={() => { setToonNieuw(false); void laad(); }} />}
      {toonRecept && <NieuwRecept producten={producten} onKlaar={() => { setToonRecept(false); void laad(); }} />}

      {gekozen ? (
        <>
          <div className="card">
            <h2>{gekozen.name}</h2>
            <p className="muted">
              {gekozen.brand ?? "geen merk"} · per 100 g: {macroKort(gekozen.per100g)}
              {gekozen.per100g.protein === null && " · eiwit onbekend (—)"}
            </p>
            <div className="row">
              <button onClick={() => setGekozen(null)}>Terug naar lijst</button>
              <button
                onClick={async () => {
                  if (!window.confirm(`“${gekozen.name}” verwijderen? Dagboekregels blijven bewaard.`)) return;
                  await del(`/api/products/${gekozen.id}`);
                  setGekozen(null);
                  void laad();
                }}
              >
                Verwijderen
              </button>
            </div>
          </div>
          <LogForm key={gekozen.id} product={gekozen} recepten={recepten} date={date} meals={meals} onGelukt={onChanged} />
        </>
      ) : (
        <>
          <h2>Recent / eigen ({producten.length})</h2>
          {producten.map((p) => (
            <div className="card" key={p.id}>
              <button className="linklike" onClick={() => setGekozen(p)}>
                <strong>{p.name}</strong> <span className="muted">· {macroKort(p.per100g)} /100 g</span>
              </button>
              <div className="muted">{p.brand ?? ""}{p.lastUsedAt ? ` · laatst gebruikt ${new Date(p.lastUsedAt).toLocaleDateString("nl-NL")}` : ""}</div>
            </div>
          ))}
          {producten.length === 0 && <p className="muted">Nog geen producten. Maak je eerste aan.</p>}
          <h2>Recepten ({recepten.length})</h2>
          {recepten.map((r) => (
            <ReceptKaart key={r.id} recept={r} producten={producten} date={date} meals={meals} onGelukt={() => { onChanged(); void laad(); }} onVerwijderd={() => void laad()} />
          ))}
        </>
      )}
    </section>
  );
}

function NieuwProduct({ onKlaar }: { onKlaar: () => void }) {
  const [naam, setNaam] = useState("");
  const [merk, setMerk] = useState("");
  const [kcal, setKcal] = useState("");
  const [eiwit, setEiwit] = useState("");
  const [kh, setKh] = useState("");
  const [vet, setVet] = useState("");
  const [porties, setPorties] = useState("");
  const [fout, setFout] = useState("");

  const opslaan = async () => {
    setFout("");
    const k = parseNL(kcal);
    if (!naam.trim() || k === null) {
      setFout("Naam en kcal per 100 g zijn verplicht.");
      return;
    }
    try {
      await post("/api/products", newProductPayload({ name: naam, brand: merk, kcal, protein: eiwit, carbs: kh, fat: vet, portions: porties }));
      onKlaar();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Opslaan mislukt.");
    }
  };

  return (
    <div className="card">
      <h2>Nieuw product</h2>
      <label>Naam*<input value={naam} onChange={(e) => setNaam(e.target.value)} /></label>
      <label>Merk<input value={merk} onChange={(e) => setMerk(e.target.value)} /></label>
      <div className="row">
        <label>Kcal /100 g*<input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} /></label>
        <label>Eiwit<input inputMode="decimal" value={eiwit} onChange={(e) => setEiwit(e.target.value)} /></label>
      </div>
      <div className="row">
        <label>Koolhydraten<input inputMode="decimal" value={kh} onChange={(e) => setKh(e.target.value)} /></label>
        <label>Vet<input inputMode="decimal" value={vet} onChange={(e) => setVet(e.target.value)} /></label>
      </div>
      <p className="muted">Leeg = onbekend (—), nooit 0. Komma mag.</p>
      <label>
        Porties (één per regel: “bord=250” of “plak” bij onbekende conversie)
        <textarea rows={2} value={porties} onChange={(e) => setPorties(e.target.value)} />
      </label>
      {fout && <p role="alert" className="error">{fout}</p>}
      <div className="row">
        <button className="primary" onClick={() => void opslaan()}>Opslaan</button>
      </div>
    </div>
  );
}

function NieuwRecept({ producten, onKlaar }: { producten: Product[]; onKlaar: () => void }) {
  const [naam, setNaam] = useState("");
  const [regels, setRegels] = useState<{ productId: string; grams: string }[]>([{ productId: producten[0]?.id ?? "", grams: "" }]);
  const [fout, setFout] = useState("");

  const opslaan = async () => {
    setFout("");
    const items = regels
      .filter((r) => r.productId && parseNL(r.grams) !== null)
      .map((r) => ({ productId: r.productId, grams: parseNL(r.grams) as number }));
    if (!naam.trim() || items.length === 0) {
      setFout("Naam en minimaal één ingrediënt met gram zijn verplicht.");
      return;
    }
    try {
      await post("/api/recipes", { name: naam.trim(), items });
      onKlaar();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Opslaan mislukt.");
    }
  };

  return (
    <div className="card">
      <h2>Nieuw recept</h2>
      <label>Naam*<input value={naam} onChange={(e) => setNaam(e.target.value)} /></label>
      {regels.map((r, i) => (
        <div className="row" key={i}>
          <select value={r.productId} onChange={(e) => setRegels(regels.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} aria-label="Ingrediënt">
            {producten.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input inputMode="decimal" placeholder="gram" value={r.grams} onChange={(e) => setRegels(regels.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))} aria-label="Gram" />
        </div>
      ))}
      <div className="row">
        <button onClick={() => setRegels([...regels, { productId: producten[0]?.id ?? "", grams: "" }])}>+ Ingrediënt</button>
      </div>
      {fout && <p role="alert" className="error">{fout}</p>}
      <div className="row">
        <button className="primary" onClick={() => void opslaan()}>Opslaan</button>
      </div>
    </div>
  );
}

function ReceptKaart({ recept, producten, date, meals, onGelukt, onVerwijderd }: { recept: Recipe; producten: Product[]; date: string; meals: MealMoment[]; onGelukt: () => void; onVerwijderd: () => void }) {
  const [open, setOpen] = useState(false);
  const [gram, setGram] = useState("");
  const [meal, setMeal] = useState(meals[0]?.id ?? "ontbijt");
  const [fout, setFout] = useState("");
  const namen = new Map(producten.map((p) => [p.id, p.name]));

  const log = async () => {
    const g = parseNL(gram);
    if (g === null || g <= 0) {
      setFout("Vul het bereide gewicht in gram in.");
      return;
    }
    try {
      await post("/api/diary", { date, meal, recipeId: recept.id, grams: g, status: "gegeten" });
      setGram("");
      setFout("");
      onGelukt();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Loggen mislukt.");
    }
  };

  return (
    <div className="card">
      <button className="linklike" onClick={() => setOpen((v) => !v)}>
        <strong>{recept.name}</strong> <span className="muted">· {recept.totals ? macroKort(recept.totals) : "—"}</span>
      </button>
      {open && (
        <>
          <ul>
            {recept.items.map((i, idx) => (
              <li key={idx}>{namen.get(i.productId) ?? "?"} — {formatNL(i.grams, 0)} g</li>
            ))}
          </ul>
          <div className="row">
            <input inputMode="decimal" placeholder="bereid gewicht (g)" value={gram} onChange={(e) => setGram(e.target.value)} aria-label="Bereid gewicht" />
            <select aria-label="Moment recept" value={meal} onChange={(e) => setMeal(e.target.value)}>{meals.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
            <button className="primary" onClick={() => void log()}>Log recept</button>
            <button
              onClick={async () => {
                if (!window.confirm(`Recept “${recept.name}” verwijderen?`)) return;
                await del(`/api/recipes/${recept.id}`);
                onVerwijderd();
              }}
            >
              Wis
            </button>
          </div>
          {fout && <p role="alert" className="error">{fout}</p>}
        </>
      )}
    </div>
  );
}
