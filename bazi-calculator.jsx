import { useState } from "react";

// ─── BaZi Data Tables ───────────────────────────────────────────────────────

const HEAVENLY_STEMS = [
  { zh: "甲", py: "Jiǎ", element: "Wood+", yin: false, color: "#2d6a2d" },
  { zh: "乙", py: "Yǐ",  element: "Wood−", yin: true,  color: "#4a8f3f" },
  { zh: "丙", py: "Bǐng",element: "Fire+", yin: false, color: "#c0392b" },
  { zh: "丁", py: "Dīng",element: "Fire−", yin: true,  color: "#e05c3a" },
  { zh: "戊", py: "Wù",  element: "Earth+",yin: false, color: "#8b6914" },
  { zh: "己", py: "Jǐ",  element: "Earth−",yin: true,  color: "#b8860b" },
  { zh: "庚", py: "Gēng",element: "Metal+",yin: false, color: "#5a5a7a" },
  { zh: "辛", py: "Xīn", element: "Metal−",yin: true,  color: "#7a7aaa" },
  { zh: "壬", py: "Rén", element: "Water+",yin: false, color: "#1a4a7a" },
  { zh: "癸", py: "Guǐ",element: "Water−",yin: true,  color: "#2a6aaa" },
];

const EARTHLY_BRANCHES = [
  { zh: "子", py: "Zǐ",  animal: "Rat",     element: "Water", month: 11, hour: [23,1]  },
  { zh: "丑", py: "Chǒu",animal: "Ox",      element: "Earth", month: 12, hour: [1,3]   },
  { zh: "寅", py: "Yín", animal: "Tiger",   element: "Wood",  month: 1,  hour: [3,5]   },
  { zh: "卯", py: "Mǎo", animal: "Rabbit",  element: "Wood",  month: 2,  hour: [5,7]   },
  { zh: "辰", py: "Chén",animal: "Dragon",  element: "Earth", month: 3,  hour: [7,9]   },
  { zh: "巳", py: "Sì",  animal: "Snake",   element: "Fire",  month: 4,  hour: [9,11]  },
  { zh: "午", py: "Wǔ",  animal: "Horse",   element: "Fire",  month: 5,  hour: [11,13] },
  { zh: "未", py: "Wèi", animal: "Goat",    element: "Earth", month: 6,  hour: [13,15] },
  { zh: "申", py: "Shēn",animal: "Monkey",  element: "Metal", month: 7,  hour: [15,17] },
  { zh: "酉", py: "Yǒu", animal: "Rooster", element: "Metal", month: 8,  hour: [17,19] },
  { zh: "戌", py: "Xū",  animal: "Dog",     element: "Earth", month: 9,  hour: [19,21] },
  { zh: "亥", py: "Hài", animal: "Pig",     element: "Water", month: 10, hour: [21,23] },
];

const ELEMENT_COLORS = {
  "Wood":  "#2d7a2d",
  "Fire":  "#c0392b",
  "Earth": "#9a7a14",
  "Metal": "#5a5a7a",
  "Water": "#1a5a9a",
};

// ─── BaZi Calculation ────────────────────────────────────────────────────────

function getStemIndex(year) {
  return (year - 4) % 10;
}

function getBranchIndex(year) {
  return (year - 4) % 12;
}

function getMonthStem(yearStemIdx, month) {
  // Month stems cycle based on year stem
  const baseMonth = (yearStemIdx % 5) * 2;
  const monthOrder = [2,3,4,5,6,7,8,9,10,11,0,1]; // Feb=Tiger start
  return (baseMonth + monthOrder[month - 1]) % 10;
}

function getMonthBranch(month) {
  // Tiger (寅, idx 2) = February (month 2) → shift by 2
  return ((month - 2 + 12) % 12 + 2) % 12;
}

function getDayStemBranch(year, month, day) {
  // Reference: Jan 1, 2000 = 庚辰 (stem 6, branch 4 = Geng Chen)
  const ref = new Date(2000, 0, 1);
  const target = new Date(year, month - 1, day);
  const diff = Math.round((target - ref) / 86400000);
  const stemIdx = ((6 + diff) % 10 + 10) % 10;
  const branchIdx = ((4 + diff) % 12 + 12) % 12;
  return { stemIdx, branchIdx };
}

function getHourBranch(hour) {
  // 子 (Zi/Rat) covers 23:00–01:00
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2) % 12;
}

function getHourStem(dayStemIdx, hourBranchIdx) {
  const base = (dayStemIdx % 5) * 2;
  return (base + hourBranchIdx) % 10;
}

function calculateBazi(year, month, day, hour) {
  const yearStemIdx = ((year - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((year - 4) % 12 + 12) % 12;
  const monthStemIdx = getMonthStem(yearStemIdx, month);
  const monthBranchIdx = getMonthBranch(month);
  const { stemIdx: dayStemIdx, branchIdx: dayBranchIdx } = getDayStemBranch(year, month, day);
  const hourBranchIdx = getHourBranch(hour);
  const hourStemIdx = getHourStem(dayStemIdx, hourBranchIdx);

  return {
    year:  { stem: HEAVENLY_STEMS[yearStemIdx],  branch: EARTHLY_BRANCHES[yearBranchIdx]  },
    month: { stem: HEAVENLY_STEMS[monthStemIdx], branch: EARTHLY_BRANCHES[monthBranchIdx] },
    day:   { stem: HEAVENLY_STEMS[dayStemIdx],   branch: EARTHLY_BRANCHES[dayBranchIdx]   },
    hour:  { stem: HEAVENLY_STEMS[hourStemIdx],  branch: EARTHLY_BRANCHES[hourBranchIdx]  },
    dayStemIdx,
  };
}

function countElements(bazi) {
  const counts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  ["year","month","day","hour"].forEach(p => {
    const stemEl = bazi[p].stem.element.replace(/[+−]/g,"");
    const branchEl = bazi[p].branch.element;
    counts[stemEl] = (counts[stemEl]||0) + 1;
    counts[branchEl] = (counts[branchEl]||0) + 1;
  });
  return counts;
}

// ─── AI Interpretation via Anthropic API ─────────────────────────────────────

async function fetchInterpretation(bazi, elements, gender) {
  const prompt = `Tu es un expert en BaZi (八字), l'astrologie des Quatre Piliers chinoise.

Voici le BaZi calculé :
- Pilier Année  : ${bazi.year.stem.zh}${bazi.year.branch.zh} (${bazi.year.stem.py} ${bazi.year.branch.py}) — ${bazi.year.stem.element} / ${bazi.year.branch.element} ${bazi.year.branch.animal}
- Pilier Mois   : ${bazi.month.stem.zh}${bazi.month.branch.zh} (${bazi.month.stem.py} ${bazi.month.branch.py}) — ${bazi.month.stem.element} / ${bazi.month.branch.element} ${bazi.month.branch.animal}
- Pilier Jour   : ${bazi.day.stem.zh}${bazi.day.branch.zh} (${bazi.day.stem.py} ${bazi.day.branch.py}) — ${bazi.day.stem.element} / ${bazi.day.branch.element} ${bazi.day.branch.animal}
- Pilier Heure  : ${bazi.hour.stem.zh}${bazi.hour.branch.zh} (${bazi.hour.stem.py} ${bazi.hour.branch.py}) — ${bazi.hour.stem.element} / ${bazi.hour.branch.element} ${bazi.hour.branch.animal}

Maître du Jour (Day Master) : ${bazi.day.stem.zh} ${bazi.day.stem.py} (${bazi.day.stem.element})
Genre : ${gender === "M" ? "Masculin" : "Féminin"}

Distribution des éléments : Bois ${elements.Wood}, Feu ${elements.Fire}, Terre ${elements.Earth}, Métal ${elements.Metal}, Eau ${elements.Water}

Fournis une interprétation structurée en français, avec ces sections (utilise exactement ces titres) :

## Personnalité & Nature profonde
## Force du Maître du Jour
## Éléments dominants & déséquilibres
## Relations & vie affective
## Carrière & potentiel
## Santé & vitalité
## Éléments favorables
## Conseil principal

Sois précis, nuancé, et évite les généralités vagues. 3 à 5 phrases par section.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "Erreur lors de l'interprétation.";
}

// ─── Parse Markdown sections ──────────────────────────────────────────────────

function parseSections(text) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace("## ", "").trim(), body: [] };
    } else if (current && line.trim()) {
      current.body.push(line.trim());
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ─── Component ───────────────────────────────────────────────────────────────

const SECTION_ICONS = {
  "Personnalité & Nature profonde": "◈",
  "Force du Maître du Jour": "⊕",
  "Éléments dominants & déséquilibres": "≋",
  "Relations & vie affective": "⌘",
  "Carrière & potentiel": "△",
  "Santé & vitalité": "◉",
  "Éléments favorables": "✦",
  "Conseil principal": "→",
};

export default function BaziApp() {
  const [form, setForm] = useState({ year: 1990, month: 6, day: 15, hour: 10, gender: "M" });
  const [bazi, setBazi] = useState(null);
  const [elements, setElements] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form"); // form | result

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    setStep("result");
    const b = calculateBazi(+form.year, +form.month, +form.day, +form.hour);
    const el = countElements(b);
    setBazi(b);
    setElements(el);
    const text = await fetchInterpretation(b, el, form.gender);
    setSections(parseSections(text));
    setLoading(false);
  };

  const reset = () => { setStep("form"); setBazi(null); setSections([]); };

  const maxEl = elements ? Math.max(...Object.values(elements)) : 1;

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>八字</span>
          <div>
            <h1 style={styles.title}>BaZi · Quatre Piliers</h1>
            <p style={styles.subtitle}>Calcul & Interprétation du Destin</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {step === "form" ? (
          <div style={styles.formCard}>
            <p style={styles.formIntro}>
              Entrez votre date et heure de naissance pour calculer vos quatre piliers célestes.
            </p>

            <div style={styles.grid2}>
              <label style={styles.label}>
                <span style={styles.labelText}>Année</span>
                <input name="year" type="number" min="1900" max="2100"
                  value={form.year} onChange={handleChange} style={styles.input} />
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Mois</span>
                <select name="month" value={form.month} onChange={handleChange} style={styles.input}>
                  {["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
                    .map((m,i) => <option key={i} value={i+1}>{i+1} – {m}</option>)}
                </select>
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Jour</span>
                <input name="day" type="number" min="1" max="31"
                  value={form.day} onChange={handleChange} style={styles.input} />
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Heure</span>
                <select name="hour" value={form.hour} onChange={handleChange} style={styles.input}>
                  {Array.from({length:24},(_,i) => (
                    <option key={i} value={i}>{String(i).padStart(2,"0")}h00</option>
                  ))}
                </select>
              </label>
            </div>

            <label style={styles.label}>
              <span style={styles.labelText}>Genre</span>
              <div style={styles.genderRow}>
                {["M","F"].map(g => (
                  <button key={g} onClick={() => setForm(f=>({...f,gender:g}))}
                    style={{...styles.genderBtn, ...(form.gender===g ? styles.genderActive : {})}}>
                    {g === "M" ? "♂ Masculin" : "♀ Féminin"}
                  </button>
                ))}
              </div>
            </label>

            <button onClick={handleSubmit} style={styles.submitBtn}>
              Calculer le BaZi →
            </button>
          </div>
        ) : (
          <div>
            {/* Four Pillars */}
            {bazi && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Les Quatre Piliers <span style={styles.zh}>四柱</span></h2>
                <div style={styles.pillarsRow}>
                  {["hour","day","month","year"].map(p => {
                    const pillar = bazi[p];
                    const labels = { hour: "Heure", day: "Jour", month: "Mois", year: "Année" };
                    const isDayMaster = p === "day";
                    return (
                      <div key={p} style={{...styles.pillar, ...(isDayMaster ? styles.pillarHighlight : {})}}>
                        <div style={styles.pillarLabel}>{labels[p]}</div>
                        {isDayMaster && <div style={styles.dmBadge}>Maître</div>}
                        <div style={{...styles.stemChar, color: ELEMENT_COLORS[pillar.stem.element.replace(/[+−]/g,"")]}}>
                          {pillar.stem.zh}
                        </div>
                        <div style={{...styles.branchChar, color: ELEMENT_COLORS[pillar.branch.element]}}>
                          {pillar.branch.zh}
                        </div>
                        <div style={styles.pillarMeta}>
                          <span>{pillar.stem.py}</span>
                          <span style={styles.dot}>·</span>
                          <span>{pillar.branch.py}</span>
                        </div>
                        <div style={styles.pillarAnimal}>{pillar.branch.animal}</div>
                        <div style={styles.pillarElements}>
                          <span style={{color: ELEMENT_COLORS[pillar.stem.element.replace(/[+−]/g,"")]}}>
                            {pillar.stem.element}
                          </span>
                          <span style={styles.dot}>·</span>
                          <span style={{color: ELEMENT_COLORS[pillar.branch.element]}}>
                            {pillar.branch.element}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Element distribution */}
            {elements && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Distribution des Éléments <span style={styles.zh}>五行</span></h2>
                <div style={styles.elemsGrid}>
                  {Object.entries(elements).map(([el, count]) => (
                    <div key={el} style={styles.elemRow}>
                      <span style={{...styles.elemName, color: ELEMENT_COLORS[el]}}>{el}</span>
                      <div style={styles.barBg}>
                        <div style={{
                          ...styles.bar,
                          width: `${(count / maxEl) * 100}%`,
                          background: ELEMENT_COLORS[el],
                        }} />
                      </div>
                      <span style={styles.elemCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Interpretation */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Interprétation <span style={styles.zh}>解析</span></h2>
              {loading ? (
                <div style={styles.loadingBox}>
                  <div style={styles.spinner} />
                  <p style={styles.loadingText}>Analyse des piliers en cours…</p>
                </div>
              ) : (
                <div style={styles.sectionsGrid}>
                  {sections.map((sec, i) => (
                    <div key={i} style={styles.secCard}>
                      <div style={styles.secHeader}>
                        <span style={styles.secIcon}>{SECTION_ICONS[sec.title] || "◆"}</span>
                        <h3 style={styles.secTitle}>{sec.title}</h3>
                      </div>
                      <p style={styles.secBody}>{sec.body.join(" ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div style={styles.resetRow}>
              <button onClick={reset} style={styles.resetBtn}>← Nouveau calcul</button>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        BaZi · Quatre Piliers de la Destinée · 八字命理
      </footer>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: "#f7f5f0",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#1a1a1a",
  },
  header: {
    background: "#1a1a1a",
    padding: "24px 32px",
  },
  headerInner: {
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  logo: {
    fontSize: 48,
    color: "#c9a84c",
    lineHeight: 1,
    letterSpacing: "-2px",
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: "normal",
    color: "#f0ece0",
    letterSpacing: "0.05em",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#888",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "40px 24px",
  },

  // Form
  formCard: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    padding: "40px 48px",
    maxWidth: 560,
    margin: "0 auto",
  },
  formIntro: {
    fontSize: 15,
    color: "#555",
    marginTop: 0,
    marginBottom: 32,
    lineHeight: 1.6,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  labelText: {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#666",
    fontFamily: "'Georgia', serif",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #ccc",
    borderRadius: 2,
    fontSize: 15,
    color: "#1a1a1a",
    background: "#fafafa",
    fontFamily: "'Georgia', serif",
    outline: "none",
  },
  genderRow: {
    display: "flex",
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    padding: "10px 0",
    border: "1px solid #ccc",
    borderRadius: 2,
    background: "#fafafa",
    color: "#555",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    transition: "all 0.15s",
  },
  genderActive: {
    background: "#1a1a1a",
    color: "#f0ece0",
    borderColor: "#1a1a1a",
  },
  submitBtn: {
    display: "block",
    width: "100%",
    marginTop: 32,
    padding: "14px 0",
    background: "#1a1a1a",
    color: "#f0ece0",
    border: "none",
    borderRadius: 2,
    fontSize: 16,
    letterSpacing: "0.08em",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    transition: "opacity 0.15s",
  },

  // Results
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#888",
    fontWeight: "normal",
    borderBottom: "1px solid #ddd",
    paddingBottom: 12,
    marginBottom: 24,
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  zh: {
    fontSize: 18,
    color: "#1a1a1a",
    letterSpacing: 2,
  },

  // Pillars
  pillarsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  pillar: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    padding: "20px 12px",
    textAlign: "center",
    position: "relative",
  },
  pillarHighlight: {
    border: "2px solid #c9a84c",
    background: "#fffdf5",
  },
  dmBadge: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#c9a84c",
    color: "#fff",
    fontSize: 9,
    padding: "2px 8px",
    borderRadius: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  pillarLabel: {
    fontSize: 10,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#999",
    marginBottom: 12,
  },
  stemChar: {
    fontSize: 42,
    lineHeight: 1,
    marginBottom: 6,
    fontWeight: "bold",
  },
  branchChar: {
    fontSize: 36,
    lineHeight: 1,
    marginBottom: 10,
  },
  pillarMeta: {
    fontSize: 12,
    color: "#888",
    display: "flex",
    justifyContent: "center",
    gap: 4,
    marginBottom: 4,
  },
  dot: { color: "#ccc" },
  pillarAnimal: {
    fontSize: 11,
    color: "#555",
    marginBottom: 6,
    fontStyle: "italic",
  },
  pillarElements: {
    fontSize: 11,
    display: "flex",
    justifyContent: "center",
    gap: 4,
  },

  // Elements bar chart
  elemsGrid: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  elemRow: {
    display: "grid",
    gridTemplateColumns: "64px 1fr 24px",
    alignItems: "center",
    gap: 14,
  },
  elemName: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: "0.05em",
  },
  barBg: {
    height: 8,
    background: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.6s ease",
  },
  elemCount: {
    fontSize: 13,
    color: "#888",
    textAlign: "right",
  },

  // Sections
  sectionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  secCard: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    padding: "20px 22px",
  },
  secHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  secIcon: {
    fontSize: 16,
    color: "#c9a84c",
    lineHeight: 1,
  },
  secTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: "bold",
    color: "#1a1a1a",
    letterSpacing: "0.03em",
  },
  secBody: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#333",
  },

  // Loading
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 0",
    gap: 20,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "2px solid #ddd",
    borderTop: "2px solid #1a1a1a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
    margin: 0,
    letterSpacing: "0.08em",
  },

  resetRow: {
    textAlign: "center",
    paddingTop: 16,
    paddingBottom: 32,
  },
  resetBtn: {
    background: "none",
    border: "1px solid #ccc",
    padding: "10px 24px",
    fontSize: 14,
    cursor: "pointer",
    color: "#555",
    borderRadius: 2,
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.05em",
  },

  footer: {
    borderTop: "1px solid #ddd",
    textAlign: "center",
    padding: "20px",
    fontSize: 12,
    color: "#aaa",
    letterSpacing: "0.15em",
    background: "#fff",
  },
};

// Inject spinner keyframe
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
