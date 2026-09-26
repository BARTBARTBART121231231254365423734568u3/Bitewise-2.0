import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { post } from "../api";
import { finishAuth } from "./auth-flow";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

export function Login({ onAuth }: { onAuth: () => Promise<void> }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);
  return (
    <section aria-label="Inloggen">
      <h1>Inloggen</h1>
      <Card>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setFout("");
            setBezig(true);
            try {
              await post("/api/auth/login", { email: email.trim(), password });
              await finishAuth(onAuth, nav, "/");
            } catch {
              setFout("Onjuiste combinatie of geen verbinding.");
            } finally {
              setBezig(false);
            }
          }}
        >
          <label>
            E-mailadres
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Wachtwoord
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {fout && <p role="alert" className="error">{fout}</p>}
          <div className="row">
            <button className="primary" disabled={bezig}>{bezig ? "Bezig…" : "Log in"}</button>
          </div>
        </form>
        <p className="muted">
          Nog geen account? <Link to="/register">Registreren</Link> · <Link to="/forgot">Wachtwoord vergeten</Link>
        </p>
      </Card>
    </section>
  );
}

export function Register({ onAuth }: { onAuth: () => Promise<void> }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fout, setFout] = useState("");
  return (
    <section aria-label="Registreren">
      <h1>Account aanmaken</h1>
      <Card>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setFout("");
            try {
              await post("/api/auth/register", { email: email.trim(), password });
              await finishAuth(onAuth, nav, "/onboarding");
            } catch (err) {
              setFout(err instanceof Error ? err.message : "Registreren mislukt.");
            }
          }}
        >
          <label>
            E-mailadres
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Wachtwoord (minimaal 12 tekens)
            <input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {fout && <p role="alert" className="error">{fout}</p>}
          <div className="row">
            <button className="primary">Account aanmaken</button>
          </div>
        </form>
        <p className="muted">Eén persoon per account. Je data is alleen voor jou zichtbaar.</p>
      </Card>
    </section>
  );
}

export function Forgot() {
  const [email, setEmail] = useState("");
  const [klaar, setKlaar] = useState("");
  return (
    <section aria-label="Wachtwoord vergeten">
      <h1>Wachtwoord herstellen</h1>
      <Card>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await post<{ message: string }>("/api/auth/password/request", { email: email.trim() });
            setKlaar(r.message);
          }}
        >
          <label>
            E-mailadres
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="row">
            <button className="primary">Aanvragen</button>
          </div>
        </form>
        {klaar && <p className="muted">{klaar}</p>}
      </Card>
    </section>
  );
}

export function Reset() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [fout, setFout] = useState("");
  const [ok, setOk] = useState(false);
  const token = params.get("token") ?? "";
  return (
    <section aria-label="Nieuw wachtwoord">
      <h1>Nieuw wachtwoord</h1>
      <Card>
        {ok ? (
          <p>Gelukt. <Link to="/login">Log in met je nieuwe wachtwoord</Link>.</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setFout("");
              try {
                await post("/api/auth/password/confirm", { token, password });
                setOk(true);
              } catch {
                setFout("Deze link is ongeldig of verlopen.");
              }
            }}
          >
            <label>
              Nieuw wachtwoord (minimaal 12 tekens)
              <input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {fout && <p role="alert" className="error">{fout}</p>}
            <div className="row">
              <button className="primary" onClick={() => nav("/login")} type="button">Annuleren</button>
              <button className="primary" type="submit">Opslaan</button>
            </div>
          </form>
        )}
      </Card>
    </section>
  );
}
