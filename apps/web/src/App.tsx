import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthError, get, loadOutbox, setOutboxOwner, todayStr, type Me } from "./api";
import { Forgot, Login, Register, Reset } from "./screens/Auth";
import { Onboarding } from "./screens/Onboarding";
import { Diary } from "./screens/Diary";
import { Food } from "./screens/Food";
import { Insights } from "./screens/Insights";
import { Health } from "./screens/Health";
import { More } from "./screens/More";

type Thema = "auto" | "licht" | "donker";

function Tabs() {
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? "tab actief" : "tab");
  return (
    <nav className="dock" aria-label="Hoofdmenu">
      <NavLink to="/" className={link}>Dagboek</NavLink>
      <NavLink to="/eten" className={link}>Eten</NavLink>
      <NavLink to="/inzicht" className={link}>Inzicht</NavLink>
      <NavLink to="/gezondheid" className={link}>Gezond</NavLink>
      <NavLink to="/meer" className={link}>Meer</NavLink>
    </nav>
  );
}

function Schil() {
  const [me, setMe] = useState<Me | null>(null);
  const [laden, setLaden] = useState(true);
  const [thema, setThema] = useState<Thema>(() => (localStorage.getItem("bw2_thema") as Thema) || "auto");
  const [online, setOnline] = useState(navigator.onLine);
  const [ververs, setVervers] = useState(0);
  const [date, setDate] = useState(todayStr());
  const nav = useNavigate();

  const verversMe = useCallback(async () => {
    try {
      const m = await get<Me>("/api/auth/me");
      setOutboxOwner(m.id);
      setMe(m);
    } catch (e) {
      if (e instanceof AuthError) { setOutboxOwner(null); setMe(null); }
    }
  }, []);

  useEffect(() => {
    void verversMe().finally(() => setLaden(false));
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [verversMe]);

  useEffect(() => {
    document.documentElement.dataset.thema = thema;
    localStorage.setItem("bw2_thema", thema);
  }, [thema]);

  const opNieuwLaden = useCallback(() => {
    setVervers((v) => v + 1);
    void verversMe();
  }, [verversMe]);

  const uitloggen = useCallback(() => {
    setOutboxOwner(null);
    setMe(null);
    nav("/login");
  }, [nav]);

  if (laden) {
    return (
      <main>
        <p className="muted">Laden…</p>
      </main>
    );
  }

  const ingelogd = me !== null;
  const moetOnboarden = ingelogd && !me.onboarded;

  return (
    <>
      <header className="topbar">
        <strong>BiteWise 2.0</strong>
        <span className="demo-badge">{online ? (loadOutbox().length > 0 ? "online · outbox wacht" : "online") : "offline"}</span>
      </header>
      {!online && <p className="offline-balk" role="status">Je bent offline — nieuwe regels worden bewaard en later verzonden.</p>}
      <main>
        <Routes>
          <Route path="/login" element={<Login onAuth={() => void verversMe()} />} />
          <Route path="/register" element={<Register onAuth={() => void verversMe()} />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/reset" element={<Reset />} />
          {!ingelogd && <Route path="*" element={<Navigate to="/login" replace />} />}
          {ingelogd && moetOnboarden && <Route path="*" element={<Onboarding onDone={() => void verversMe()} />} />}
          {ingelogd && !moetOnboarden && (
            <>
              <Route path="/" element={<Diary date={date} setDate={setDate} refreshSignal={ververs} onChanged={opNieuwLaden} />} />
              <Route path="/eten" element={<Food date={date} meals={me.meals} onChanged={opNieuwLaden} />} />
              <Route path="/inzicht" element={<Insights />} />
              <Route path="/gezondheid" element={<Health me={me} onChanged={opNieuwLaden} />} />
              <Route path="/meer" element={<More me={me} thema={thema} setThema={setThema} onChanged={opNieuwLaden} onLogout={uitloggen} />} />
              <Route path="/onboarding" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
      {ingelogd && !moetOnboarden && <Tabs />}
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Schil />
    </BrowserRouter>
  );
}
