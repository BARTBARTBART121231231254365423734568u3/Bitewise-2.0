import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  del,
  get,
  loadOutbox,
  post,
  put,
  resolveConflict,
  syncOutbox,
  type MealMoment,
  type Me,
  type OutboxItem,
} from "../api";

type Thema = "auto" | "licht" | "donker";

export function More({ me, thema, setThema, onChanged, onLogout }: {
  me: Me;
  thema: Thema;
  setThema: (t: Thema) => void;
  onChanged: () => void;
  onLogout: () => void;
}) {
  const nav = useNavigate();
  const [maaltijden, setMaaltijden] = useState<MealMoment[]>(me.meals);
  const [sessies, setSessies] = useState<{ id: string; createdAt: string; current: boolean }[]>([]);
  const [zoek, setZoek] = useState("");
  const [notities, setNotities] = useState<{ date: string; note: string }[]>([]);
  const [rij, setRij] = useState<OutboxItem[]>([]);
  const [fout, setFout] = useState("");
  const [melding, setMelding] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");

  const laad = async () => {
    try {
      const s = await get<{ sessions: { id: string; createdAt: string; current: boolean }[] }>("/api/auth/sessions");
      setSessies(s.sessions);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Laden mislukt.");
    }
    setRij(loadOutbox());
  };

  useEffect(() => {
    void laad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bewaarMaaltijden = async () => {
    const schoon = maaltijden.map((m, i) => ({ id: m.id.trim() || `moment-${i}`, label: m.label.trim() || `Moment ${i + 1}`, sort: i }));
    if (schoon.length === 0 || schoon.length > 12) {
      setFout("Kies 1 tot 12 maaltijdmomenten.");
      return;
    }
    try {
      await put("/api/profile", { meals: schoon });
      setMelding("Maaltijdmomenten bewaard.");
      onChanged();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Bewaren mislukt.");
    }
  };

  const zoekNotities = async () => {
    if (!zoek.trim()) return;
    try {
      const r = await get<{ results: { date: string; note: string }[] }>(`/api/notes/search?q=${encodeURIComponent(zoek.trim())}`);
      setNotities(r.results ?? []);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Zoeken mislukt.");
    }
  };

  const verwijderAccount = async () => {
    if (!window.confirm("Weet je het zeker? Al je data wordt verwijderd. Dit kan niet ongedaan worden gemaakt.")) return;
    if (!wachtwoord) {
      setFout("Vul je wachtwoord in ter bevestiging.");
      return;
    }
    try {
      await del<{ deleted: boolean }>("/api/account", { password: wachtwoord });
      onLogout();
      nav("/login");
    } catch {
      setFout("Verwijderen mislukt — controleer je wachtwoord.");
    }
  };

  return (
    <section aria-label="Meer">
      <h1>Meer</h1>
      {fout && <p role="alert" className="error">{fout}</p>}
      {melding && <p className="ok">{melding}</p>}

      <div className="card">
        <h2>Account</h2>
        <p className="muted">{me.email}</p>
        <div className="row">
          <button
            onClick={async () => {
              await post("/api/auth/logout");
              onLogout();
              nav("/login");
            }}
          >
            Uitloggen
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Offline-rij ({rij.length})</h2>
        {rij.length === 0 && <p className="muted">Niets in de wachtrij.</p>}
        {rij.map((i) => (
          <div key={i.id} className="conflict">
            <div>
              {i.kind === "diary-create" ? "Nieuwe regel" : "Bewerking"} · {new Date(i.createdAt).toLocaleString("nl-NL")}
              {i.lastError && !i.conflictServer && <span className="muted"> · fout: {i.lastError}</span>}
            </div>
            {i.conflictServer ? (
              <div>
                <p className="error">Conflict: op de server staat inmiddels iets anders.</p>
                <div className="row">
                  <button onClick={() => void resolveConflict(i, "mine").then(() => { setMelding("Jouw versie bewaard."); void laad(); onChanged(); })}>Mijn versie houden</button>
                  <button onClick={() => void resolveConflict(i, "theirs").then(() => { setMelding("Serverversie behouden."); void laad(); onChanged(); })}>Server houden</button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {rij.length > 0 && (
          <div className="row" style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                void syncOutbox().then((r) => {
                  setMelding(`${r.done} verzonden, ${r.conflicts} conflict(en).`);
                  void laad();
                  onChanged();
                });
              }}
            >
              Nu synchroniseren
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Maaltijdmomenten</h2>
        {maaltijden.map((m, i) => (
          <div className="row" key={i}>
            <input value={m.label} onChange={(e) => setMaaltijden(maaltijden.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label={`Moment ${i + 1}`} />
            <button onClick={() => setMaaltijden(maaltijden.filter((_, j) => j !== i))} aria-label={`Verwijder moment ${i + 1}`}>✕</button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={() => setMaaltijden([...maaltijden, { id: `moment-${Date.now()}`, label: "", sort: maaltijden.length }])}>+ Moment</button>
          <button className="primary" onClick={() => void bewaarMaaltijden()}>Bewaren</button>
        </div>
      </div>

      <div className="card">
        <h2>Notities doorzoeken</h2>
        <div className="row">
          <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="zoekwoord" aria-label="Notities doorzoeken" />
          <button onClick={() => void zoekNotities()}>Zoek</button>
        </div>
        <ul>
          {notities.map((n) => (
            <li key={n.date}>{new Date(`${n.date}T00:00:00`).toLocaleDateString("nl-NL")} — {n.note}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Weergave</h2>
        <div className="row">
          {(["auto", "licht", "donker"] as Thema[]).map((t) => (
            <button key={t} className={thema === t ? "primary" : ""} onClick={() => setThema(t)}>
              {t === "auto" ? "Auto" : t === "licht" ? "Licht" : "Donker"}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Actieve sessies ({sessies.length})</h2>
        <ul>
          {sessies.map((s) => (
            <li key={s.id}>
              {new Date(s.createdAt).toLocaleString("nl-NL")}{s.current ? " · dit apparaat" : ""}{" "}
              {!s.current && (
                <button
                  onClick={async () => {
                    await del(`/api/auth/sessions/${s.id}`);
                    await laad();
                  }}
                >
                  Intrekken
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="row">
          <button
            onClick={async () => {
              await post("/api/auth/logout-all");
              setMelding("Overal anders uitgelogd.");
              await laad();
            }}
          >
            Overal anders uitloggen
          </button>
        </div>
      </div>

      <div className="card danger">
        <h2>Account en data verwijderen</h2>
        <p className="muted">Verwijdert je account en alle bijbehorende data. Controleerbaar: daarna kun je niet meer inloggen.</p>
        <label>
          Wachtwoord ter bevestiging
          <input type="password" autoComplete="current-password" value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
        </label>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="danger-btn" onClick={() => void verwijderAccount()}>Verwijder alles</button>
        </div>
      </div>
    </section>
  );
}
