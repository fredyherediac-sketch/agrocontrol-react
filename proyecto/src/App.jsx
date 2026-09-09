import { useState, useEffect } from "react";

/* ============================================================
   DATOS: unidades, monedas y estilos
   ============================================================ */
const UNIT_DATA = {
  length: {
    label: "Longitud",
    units: {
      m: { name: "Metros (m)", factor: 1 },
      km: { name: "Kilómetros (km)", factor: 1000 },
      cm: { name: "Centímetros (cm)", factor: 0.01 },
      mm: { name: "Milímetros (mm)", factor: 0.001 },
      mi: { name: "Millas (mi)", factor: 1609.344 },
      yd: { name: "Yardas (yd)", factor: 0.9144 },
      ft: { name: "Pies (ft)", factor: 0.3048 },
      in: { name: "Pulgadas (in)", factor: 0.0254 },
    },
  },
  weight: {
    label: "Peso / Masa",
    units: {
      kg: { name: "Kilogramos (kg)", factor: 1 },
      g: { name: "Gramos (g)", factor: 0.001 },
      mg: { name: "Miligramos (mg)", factor: 0.000001 },
      lb: { name: "Libras (lb)", factor: 0.453592 },
      oz: { name: "Onzas (oz)", factor: 0.0283495 },
      ton: { name: "Toneladas (t)", factor: 1000 },
    },
  },
  temp: {
    label: "Temperatura",
    units: {
      c: { name: "Celsius (°C)" },
      f: { name: "Fahrenheit (°F)" },
      k: { name: "Kelvin (K)" },
    },
  },
};

const CURRENCIES = {
  USD: "Dólar estadounidense",
  COP: "Peso colombiano",
  EUR: "Euro",
  MXN: "Peso mexicano",
  ARS: "Peso argentino",
  BRL: "Real brasileño",
  CLP: "Peso chileno",
  PEN: "Sol peruano",
  GBP: "Libra esterlina",
  CAD: "Dólar canadiense",
};

const FALLBACK_RATES = {
  USD: 1, COP: 4050, EUR: 0.92, MXN: 18.5, ARS: 1300,
  BRL: 5.6, CLP: 970, PEN: 3.75, GBP: 0.79, CAD: 1.38,
};

const COLORS = {
  bg: "#12161D",
  surface: "#1B222C",
  surface2: "#232C38",
  surface3: "#2C3644",
  line: "#313C4A",
  text: "#E9EDF3",
  muted: "#8A93A3",
  amber: "#F2B138",
  cyan: "#4FD3C4",
  violet: "#B79CF2",
  danger: "#F2665E",
  success: "#59C97E",
  readoutBg: "#0B0E13",
};

const ACCENTS = { units: COLORS.amber, currency: COLORS.cyan, bmi: COLORS.violet };

const fontMono = "'Space Mono', 'Courier New', monospace";
const fontUI = "'Inter', system-ui, sans-serif";

/* ============================================================
   HELPERS
   ============================================================ */
function formatNumber(n) {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1000000 || (Math.abs(n) < 0.0001 && n !== 0)) {
    return n.toExponential(4);
  }
  return n.toLocaleString("es-CO", { maximumFractionDigits: 6 });
}

function convertTemp(value, from, to) {
  if (isNaN(value)) return NaN;
  let celsius;
  if (from === "c") celsius = value;
  if (from === "f") celsius = ((value - 32) * 5) / 9;
  if (from === "k") celsius = value - 273.15;
  if (to === "c") return celsius;
  if (to === "f") return (celsius * 9) / 5 + 32;
  if (to === "k") return celsius + 273.15;
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export default function App() {
  const [tab, setTab] = useState("units");

  return (
    <div style={styles.body}>
      <div style={styles.wrap}>
        <Header />
        <TabSwitcher tab={tab} setTab={setTab} />
        {tab === "units" && <UnitsPanel />}
        {tab === "currency" && <CurrencyPanel />}
        {tab === "bmi" && <BmiPanel />}
        <footer style={styles.footer}>MultiConvert · React + Capacitor</footer>
      </div>
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/921/921490.png"
          alt="MultiConvert"
          style={{ width: 28, height: 28 }}
        />
      </div>
      <div>
        <h1 style={styles.h1}>MultiConvert</h1>
        <p style={styles.headerSub}>unidades · monedas · imc</p>
      </div>
    </header>
  );
}

/* ---------------- Tab switcher (elemento distintivo) ---------------- */
function TabSwitcher({ tab, setTab }) {
  const tabs = [
    { key: "units", label: "Unidades" },
    { key: "currency", label: "Monedas" },
    { key: "bmi", label: "IMC" },
  ];
  return (
    <nav style={styles.switchboard}>
      {tabs.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...styles.switchBtn,
              background: active ? COLORS.surface3 : "transparent",
              color: active ? ACCENTS[t.key] : COLORS.muted,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "currentColor",
                opacity: active ? 1 : 0.5,
                display: "inline-block",
              }}
            />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------- Readout compartido (elemento distintivo) ---------------- */
function Readout({ label, value, sub, accent, badge }) {
  return (
    <div style={styles.readout}>
      <div style={styles.readoutLabel}>{label}</div>
      <div style={{ ...styles.readoutValue, color: accent, textShadow: `0 0 18px ${accent}55` }}>
        {value}
      </div>
      {sub && <div style={styles.readoutSub}>{sub}</div>}
      {badge}
    </div>
  );
}

/* ============================================================
   PANEL 1: CONVERSOR DE UNIDADES
   ============================================================ */
function UnitsPanel() {
  const [category, setCategory] = useState("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const [value, setValue] = useState("1");

  useEffect(() => {
    const keys = Object.keys(UNIT_DATA[category].units);
    setFrom(keys[0]);
    setTo(keys.length > 1 ? keys[1] : keys[0]);
  }, [category]);

  const num = parseFloat(value);
  let result = NaN;
  let formulaText = "";

  if (!isNaN(num)) {
    if (category === "temp") {
      result = convertTemp(num, from, to);
      formulaText = `${num} ${from.toUpperCase()} → ${to.toUpperCase()}`;
    } else {
      const cat = UNIT_DATA[category];
      const baseValue = num * cat.units[from].factor;
      result = baseValue / cat.units[to].factor;
      formulaText = `1 ${from} = ${formatNumber(cat.units[from].factor / cat.units[to].factor)} ${to}`;
    }
  }

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <section style={styles.card}>
      <div style={styles.fieldRow}>
        <Field label="Categoría">
          <select
            style={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {Object.entries(UNIT_DATA).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={styles.fieldRow}>
        <Field label="De">
          <select style={styles.select} value={from} onChange={(e) => setFrom(e.target.value)}>
            {Object.entries(UNIT_DATA[category].units).map(([key, u]) => (
              <option key={key} value={key}>{u.name}</option>
            ))}
          </select>
        </Field>
        <SwapButton onClick={swap} />
        <Field label="A">
          <select style={styles.select} value={to} onChange={(e) => setTo(e.target.value)}>
            {Object.entries(UNIT_DATA[category].units).map(([key, u]) => (
              <option key={key} value={key}>{u.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={styles.fieldRow}>
        <Field label="Valor">
          <input
            type="number"
            inputMode="decimal"
            style={styles.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
      </div>

      <Readout
        label="Resultado"
        value={isNaN(result) ? "—" : formatNumber(result)}
        sub={formulaText}
        accent={COLORS.amber}
      />
    </section>
  );
}

/* ============================================================
   PANEL 2: CONVERSOR DE MONEDAS
   ============================================================ */
function CurrencyPanel() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("COP");
  const [amount, setAmount] = useState("1");
  const [rates, setRates] = useState(null);
  const [online, setOnline] = useState(true);
  const [statusText, setStatusText] = useState("Consultando tasas de cambio…");

  useEffect(() => {
    let cancelled = false;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => {
        if (!res.ok) throw new Error("Respuesta no válida");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.result !== "success") throw new Error("API no disponible");
        setRates(data.rates);
        setOnline(true);
        setStatusText(`Tasas actualizadas (${data.time_last_update_utc || "ahora"})`);
      })
      .catch(() => {
        if (cancelled) return;
        setRates(FALLBACK_RATES);
        setOnline(false);
        setStatusText("Sin conexión — usando tasas de referencia guardadas");
      });
    return () => { cancelled = true; };
  }, []);

  const num = parseFloat(amount);
  let result = NaN, unitRate = NaN;

  if (rates && !isNaN(num)) {
    const usd = num / rates[from];
    result = usd * rates[to];
    unitRate = rates[to] / rates[from];
  }

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <section style={styles.card}>
      <div style={styles.fieldRow}>
        <Field label="De">
          <select style={styles.select} value={from} onChange={(e) => setFrom(e.target.value)}>
            {Object.entries(CURRENCIES).map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
        </Field>
        <SwapButton onClick={swap} />
        <Field label="A">
          <select style={styles.select} value={to} onChange={(e) => setTo(e.target.value)}>
            {Object.entries(CURRENCIES).map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={styles.fieldRow}>
        <Field label="Monto">
          <input
            type="number"
            inputMode="decimal"
            style={styles.input}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
      </div>

      <Readout
        label="Resultado"
        value={isNaN(result) ? "—" : `${formatNumber(result)} ${to}`}
        sub={isNaN(unitRate) ? "" : `1 ${from} = ${formatNumber(unitRate)} ${to}`}
        accent={COLORS.cyan}
      />

      <div style={styles.statusBar}>
        <span style={{ ...styles.statusDot, background: online ? COLORS.success : COLORS.danger }} />
        <span>{statusText}</span>
      </div>
    </section>
  );
}

/* ============================================================
   PANEL 3: CALCULADORA IMC
   ============================================================ */
function BmiPanel() {
  const [weight, setWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const w = parseFloat(weight);
  const h = parseFloat(heightCm);
  let bmi = NaN, category = "", badgeColor = COLORS.muted;

  if (!isNaN(w) && !isNaN(h) && h > 0) {
    const heightM = h / 100;
    bmi = w / (heightM * heightM);
    if (bmi < 18.5) { category = "Bajo peso"; badgeColor = COLORS.cyan; }
    else if (bmi < 25) { category = "Peso normal"; badgeColor = COLORS.success; }
    else if (bmi < 30) { category = "Sobrepeso"; badgeColor = COLORS.amber; }
    else { category = "Obesidad"; badgeColor = COLORS.danger; }
  }

  return (
    <section style={styles.card}>
      <div style={styles.fieldRow}>
        <Field label="Peso (kg)">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ej: 70"
            style={styles.input}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
        <Field label="Estatura (cm)">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ej: 175"
            style={styles.input}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </Field>
      </div>

      <Readout
        label="Índice de Masa Corporal"
        value={isNaN(bmi) ? "—" : bmi.toFixed(1)}
        accent={COLORS.violet}
        badge={
          category && (
            <span style={{ ...styles.badge, background: `${badgeColor}26`, color: badgeColor }}>
              {category}
            </span>
          )
        }
      />

      <p style={styles.hint}>
        El IMC es una referencia general y no reemplaza la evaluación de un profesional de la salud.
      </p>
    </section>
  );
}

/* ---------------- Subcomponentes reutilizables ---------------- */
function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function SwapButton({ onClick }) {
  return (
    <button onClick={onClick} style={styles.swapBtn} aria-label="Invertir">
      ⇄
    </button>
  );
}

/* ============================================================
   ESTILOS (objetos JS, sin dependencias externas)
   ============================================================ */
const styles = {
  body: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: fontUI,
    paddingBottom: 40,
  },
  wrap: { maxWidth: 480, margin: "0 auto", padding: "22px 18px 10px" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
  logo: {
    width: 44, height: 44, borderRadius: 12,
    background: COLORS.surface2, border: `1px solid ${COLORS.line}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
  },
  h1: { fontSize: 18, letterSpacing: "0.02em", margin: 0, fontWeight: 800 },
  headerSub: { margin: "2px 0 0", fontSize: 12, color: COLORS.muted, fontFamily: fontMono },
  switchboard: {
    display: "flex", background: COLORS.surface, border: `1px solid ${COLORS.line}`,
    borderRadius: 999, padding: 4, gap: 4, marginBottom: 20,
  },
  switchBtn: {
    flex: 1, border: "none", fontFamily: fontUI, fontWeight: 600, fontSize: 12.5,
    padding: "10px 6px", borderRadius: 999, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  card: {
    background: COLORS.surface, border: `1px solid ${COLORS.line}`,
    borderRadius: 14, padding: 18, marginBottom: 14,
  },
  fieldRow: { display: "flex", gap: 10, marginBottom: 12 },
  field: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: {
    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
    color: COLORS.muted, fontWeight: 600,
  },
  select: {
    background: COLORS.surface2, border: `1px solid ${COLORS.line}`, color: COLORS.text,
    fontFamily: fontMono, fontSize: 15, padding: "11px 10px", borderRadius: 10,
    outline: "none", width: "100%",
  },
  input: {
    background: COLORS.surface2, border: `1px solid ${COLORS.line}`, color: COLORS.text,
    fontFamily: fontMono, fontSize: 15, padding: "11px 10px", borderRadius: 10,
    outline: "none", width: "100%", boxSizing: "border-box",
  },
  swapBtn: {
    alignSelf: "flex-end", background: COLORS.surface2, border: `1px solid ${COLORS.line}`,
    color: COLORS.muted, width: 40, height: 40, borderRadius: 10, cursor: "pointer",
    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  readout: {
    position: "relative", background: COLORS.readoutBg, border: `1px solid ${COLORS.line}`,
    borderRadius: 10, padding: "18px 16px", marginTop: 6,
  },
  readoutLabel: {
    fontFamily: fontMono, fontSize: 10.5, textTransform: "uppercase",
    letterSpacing: "0.12em", color: COLORS.muted, marginBottom: 6,
  },
  readoutValue: { fontFamily: fontMono, fontWeight: 700, fontSize: 28, lineHeight: 1.2, wordBreak: "break-word" },
  readoutSub: { fontFamily: fontMono, fontSize: 11, color: COLORS.muted, marginTop: 4 },
  badge: {
    display: "inline-block", marginTop: 10, padding: "5px 11px",
    borderRadius: 999, fontSize: 11.5, fontWeight: 700, fontFamily: fontUI,
  },
  hint: { fontSize: 11.5, color: COLORS.muted, marginTop: 10, lineHeight: 1.5 },
  statusBar: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: COLORS.muted,
    fontFamily: fontMono, marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${COLORS.line}`,
  },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  footer: { textAlign: "center", fontSize: 11, color: COLORS.muted, marginTop: 26, fontFamily: fontMono },
};