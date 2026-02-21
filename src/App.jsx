import { useState } from "react";
const steps = [
  {
    id: "activite",
    question: "Complète cette phrase :",
    subtitle: "Je suis [métier] et j'aide [qui] à [quoi].",
    placeholder: "Ex : Je suis consultant RH et j'aide les PME à recruter sans perdre 3 mois à chaque fois.",
    hint: "Une seule phrase, la plus précise possible.",
  },
  {
    id: "angle",
    question: "Qu'est-ce qui te différencie ?",
    subtitle: "Ton angle unique vs tous ceux qui font la même chose.",
    placeholder: "Ex : Je n'utilise pas de méthodes génériques — je construis des systèmes sur mesure en 2 semaines au lieu de 6 mois.",
    hint: "Ce que tes concurrents ne peuvent pas dire.",
  },
  {
    id: "piliers",
    question: "Tes 3 sujets piliers LinkedIn.",
    subtitle: "Sur quels thèmes veux-tu être reconnu ?",
    placeholder: "Ex : Automatisation des RH, recrutement sans CV, IA appliquée aux PME.",
    hint: "3 thèmes max — ce sont les sujets sur lesquels tu veux qu'on pense à toi.",
  },
  {
    id: "cible",
    question: "Ce que ta cible se dit.",
    subtitle: "Quelle phrase répète-t-elle quand elle parle de son problème ?",
    placeholder: "Ex : \"J'ai pas le temps de tout faire mais je peux pas me permettre d'embaucher.\"",
    hint: "En langage naturel, comme si elle te parlait directement.",
  },
  {
    id: "objectif",
    question: "Ton objectif LinkedIn.",
    subtitle: "Pourquoi tu postes ?",
    placeholder: "Ex : Attirer des clients, construire ma notoriété sur l'IA, partager mes opinions sur le futur du travail...",
    hint: "Claude n'écrit pas le même post selon l'objectif.",
  },
  {
    id: "lignes_rouges",
    question: "Tes lignes rouges.",
    subtitle: "Ce que tu ne dis jamais, le ton que tu refuses.",
    placeholder: "Ex : Pas de promesses de résultats rapides, pas de jargon corporate, jamais de ton donneur de leçons.",
    hint: "Ce qui te ferait supprimer un post immédiatement.",
  },
];
function buildPrompt(answers) {
  return `Tu es un expert en personal branding LinkedIn.

Voici le profil d'un professionnel :
- Activité : ${answers.activite}
- Angle unique : ${answers.angle}
- Sujets piliers : ${answers.piliers}
- Ce que sa cible se dit : ${answers.cible}
- Objectif LinkedIn : ${answers.objectif}
- Lignes rouges : ${answers.lignes_rouges}
Génère une analyse stratégique structurée EXACTEMENT ainsi (respecte ces titres) :
### TON POSITIONNEMENT
En 2-3 phrases percutantes, reformule son positionnement de façon mémorable. Pas de jargon.
### CE QUI VA RÉSONNER AVEC TA CIBLE
3 insights concrets sur ce qui va accrocher ta cible. Basé sur ce qu'elle se dit.
### TES 5 MEILLEURS ANGLES DE POSTS
Pour chaque angle : un titre de post accrocheur + une phrase qui explique pourquoi ça va marcher.
### TON INTERDITS ÉDITORIAUX
Reformule ses lignes rouges de façon claire et actionnable pour Claude.
---
INSTRUCTIONS POUR CLAUDE (ne pas afficher à l'utilisateur - usage interne uniquement)
Tu es l'assistant LinkedIn de ${answers.activite.split(" ")[2] || "cet auteur"}.
Positionnement : ${answers.activite}
Angle unique : ${answers.angle}
Sujets piliers : ${answers.piliers}
Cible : ${answers.cible}
Objectif : ${answers.objectif}
Interdits : ${answers.lignes_rouges}
Toujours écrire dans un style direct, sans jargon, adapté à LinkedIn francophone.`;
}
function parseResult(text) {
  const sections = {
    positionnement: "",
    resonance: "",
    angles: "",
    interdits: "",
    claude: "",
  };
  const posMatch = text.match(/### TON POSITIONNEMENT\n([\s\S]*?)(?=###|---)/);
  const resMatch = text.match(/### CE QUI VA RÉSONNER[\s\S]*?\n([\s\S]*?)(?=###|---)/);
  const angMatch = text.match(/### TES 5 MEILLEURS ANGLES[\s\S]*?\n([\s\S]*?)(?=###|---)/);
  const intMatch = text.match(/### TON INTERDITS[\s\S]*?\n([\s\S]*?)(?=###|---)/);
  const claudeMatch = text.match(/INSTRUCTIONS POUR CLAUDE[\s\S]*?\n([\s\S]*?)$/);
  if (posMatch) sections.positionnement = posMatch[1].trim();
  if (resMatch) sections.resonance = resMatch[1].trim();
  if (angMatch) sections.angles = angMatch[1].trim();
  if (intMatch) sections.interdits = intMatch[1].trim();
  if (claudeMatch) sections.claude = claudeMatch[0].trim();
  return sections;
}
function buildClaudeInstructions(answers, claudeSection) {
  return claudeSection || `Tu es mon assistant LinkedIn personnel.
Mon activité : ${answers.activite}
Mon angle unique : ${answers.angle}
Mes sujets piliers : ${answers.piliers}
Ce que ma cible se dit : ${answers.cible}
Mon objectif LinkedIn : ${answers.objectif}
Mes lignes rouges : ${answers.lignes_rouges}
Quand je te demande d'écrire un post LinkedIn, respecte toujours mon ton, parle à ma cible, et ne franchis jamais mes lignes rouges.`;
}
export default function TrouveTaCible() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const step = steps[current];
  const isLast = current + 1 >= steps.length;
  const progress = (current / steps.length) * 100;
  function handleNext() {
    if (!value.trim()) return;
    const newAnswers = { ...answers, [step.id]: value.trim() };
    setAnswers(newAnswers);
    setValue("");
    if (isLast) {
      generate(newAnswers);
    } else {
      setCurrent(current + 1);
    }
  }
  async function generate(finalAnswers) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(finalAnswers) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur API");
      const text = data.text || "";
      setRawText(text);
      setParsed(parseResult(text));
    } catch (e) {
      setError("Une erreur s'est produite. Réessaie.");
    } finally {
      setLoading(false);
    }
  }
  function handleCopy() {
    const instructions = buildClaudeInstructions(answers, parsed?.claude);
    navigator.clipboard.writeText(instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function handleRestart() {
    setCurrent(0);
    setAnswers({});
    setValue("");
    setLoading(false);
    setParsed(null);
    setRawText("");
    setError(null);
    setCopied(false);
  }
  const Card = ({ title, emoji, content, accent }) => (
    <div style={{
      background: "#111",
      border: `1px solid ${accent || "#222"}`,
      borderRadius: "10px",
      padding: "20px 24px",
      marginBottom: "16px",
    }}>
      <div style={{
        fontSize: "12px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        color: accent || "#555",
        fontWeight: 500,
        marginBottom: "12px",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {emoji} {title}
      </div>
      <div style={{
        color: "#ccc",
        fontSize: "14px",
        lineHeight: 1.7,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
        whiteSpace: "pre-wrap",
      }}>
        {content}
      </div>
    </div>
  );
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "48px 24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .fade { animation: fadeUp 0.4s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus { outline: none; border-color: #e8c547 !important; }
        .btn-gold:hover { background: #f0d060 !important; transform: translateY(-1px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.05) !important; }
        .btn-outline:hover { background: #e8c547 !important; color: #0a0a0a !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="fade" key={parsed ? "result" : loading ? "loading" : current} style={{ width: "400px" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#e8c547", textTransform: "uppercase", fontWeight: 500, marginBottom: "12px" }}>
            Club Smart — Outil LinkedIn
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>
            Définis ta voix<br /><span style={{ color: "#e8c547" }}>LinkedIn</span>
          </h1>
        </div>
        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="spin" style={{ width: "32px", height: "32px", border: "2px solid #1e1e1e", borderTopColor: "#e8c547", borderRadius: "50%", margin: "0 auto 20px" }} />
            <div style={{ color: "#444", fontSize: "14px", fontWeight: 300 }}>Claude analyse ton profil...</div>
          </div>
        )}
        {/* ERROR */}
        {error && !loading && (
          <div style={{ background: "#110a0a", border: "1px solid #2a1010", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
            <div style={{ color: "#ff6b6b", fontSize: "14px", marginBottom: "16px" }}>{error}</div>
            <button onClick={handleRestart} className="btn-ghost" style={{ background: "transparent", border: "1px solid #222", color: "#555", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "13px" }}>Recommencer</button>
          </div>
        )}
        {/* RESULT */}
        {parsed && !loading && (
          <>
            {parsed.positionnement && <Card title="Ton positionnement" emoji="🎯" content={parsed.positionnement} accent="#e8c547" />}
            {parsed.resonance && <Card title="Ce qui va résonner avec ta cible" emoji="💡" content={parsed.resonance} accent="#7ec8e3" />}
            {parsed.angles && <Card title="Tes meilleurs angles de posts" emoji="✍️" content={parsed.angles} accent="#a8e6a3" />}
            {parsed.interdits && <Card title="Tes interdits éditoriaux" emoji="🚫" content={parsed.interdits} accent="#e8a0a0" />}
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "24px", marginTop: "8px" }}>
              <div style={{ color: "#333", fontSize: "12px", fontStyle: "italic", marginBottom: "16px", textAlign: "center" }}>
                Copie tes instructions et colle-les dans les instructions de ton Project Claude.
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button className="btn-outline" onClick={handleCopy} style={{ background: copied ? "#e8c547" : "transparent", color: copied ? "#0a0a0a" : "#e8c547", border: "1px solid #e8c547", borderRadius: "6px", padding: "14px 28px", fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? "✓ Copié !" : "Copier mes instructions Claude"}
                </button>
                <button className="btn-ghost" onClick={handleRestart} style={{ background: "transparent", color: "#333", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "14px 20px", fontSize: "14px", cursor: "pointer" }}>
                  Recommencer
                </button>
              </div>
            </div>
          </>
        )}
        {/* QUESTIONNAIRE */}
        {!loading && !parsed && !error && (
          <>
            {/* Progress */}
            <div style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#444", fontWeight: 300 }}>{current + 1} / {steps.length}</span>
                <span style={{ fontSize: "12px", color: "#e8c547", fontWeight: 500 }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: "1px", background: "#1a1a1a" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "#e8c547", transition: "width 0.4s ease" }} />
              </div>
            </div>
            {/* Question */}
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, color: "#fff", margin: "0 0 6px 0", lineHeight: 1.2 }}>
                {step.question}
              </h2>
              {step.subtitle && (
                <div style={{ fontSize: "16px", color: "#e8c547", fontWeight: 400, marginBottom: "6px" }}>
                  {step.subtitle}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#444", fontStyle: "italic", fontWeight: 300 }}>{step.hint}</div>
            </div>
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleNext(); }}
              placeholder={step.placeholder}
              rows={4}
              style={{ width: "100%", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "16px", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 300, lineHeight: 1.6, resize: "vertical", transition: "border-color 0.2s", marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button className="btn-gold" onClick={handleNext} disabled={!value.trim()} style={{ background: value.trim() ? "#e8c547" : "#1a1a1a", color: value.trim() ? "#0a0a0a" : "#333", border: "none", borderRadius: "6px", padding: "14px 28px", fontSize: "14px", fontWeight: 500, cursor: value.trim() ? "pointer" : "not-allowed", transition: "all 0.2s", letterSpacing: "0.3px" }}>
                {isLast ? "Analyser →" : "Suivant →"}
              </button>
              {current > 0 && (
                <button className="btn-ghost" onClick={() => { setCurrent(current - 1); setValue(answers[steps[current - 1].id] || ""); }} style={{ background: "transparent", color: "#444", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "14px 20px", fontSize: "14px", cursor: "pointer" }}>
                  ← Retour
                </button>
              )}
              <span style={{ fontSize: "11px", color: "#2a2a2a", marginLeft: "auto" }}>⌘ + Entrée</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
