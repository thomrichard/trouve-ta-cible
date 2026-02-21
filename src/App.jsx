import { useState } from "react";
const steps = [
  {
    id: "activite",
    question: "C'est quoi ton activité ou ton métier ?",
    placeholder: "Ex : consultant RH, coach business, freelance développeur...",
    hint: "Sois précis — pas juste 'entrepreneur'",
  },
  {
    id: "probleme",
    question: "Quel problème tu résous pour tes clients ?",
    placeholder: "Ex : ils perdent des heures sur des tâches répétitives...",
    hint: "Pense au problème concret, pas à ta solution",
  },
  {
    id: "pourqui",
    question: "Pour qui ? Décris ta cible idéale.",
    placeholder: "Ex : dirigeants de PME de 10-50 personnes dans le secteur...",
    hint: "Secteur, poste, taille d'entreprise, situation de vie...",
  },
  {
    id: "transformation",
    question: "Quelle transformation tu apportes ?",
    placeholder: "Ex : ils passent de 3h de reporting à 20 minutes grâce à...",
    hint: "Avant → Après. Sois concret et chiffré si possible",
  },
  {
    id: "jamais",
    question: "Ce que tu ne veux JAMAIS dire ou vendre.",
    placeholder: "Ex : pas de growth hacking, pas de promesses magiques...",
    hint: "Tes lignes rouges éditoriales",
  },
  {
    id: "ton",
    question: "Quel est ton ton naturel sur LinkedIn ?",
    placeholder: "Ex : direct et sans fioritures, storytelling personnel, pédagogue...",
    hint: "Comment tu t'exprimes naturellement ?",
  },
];
function buildPrompt(answers) {
  return `Tu es un expert en personal branding et en stratégie de contenu LinkedIn.
Voici les informations d'un professionnel :
- Activité/métier : ${answers.activite}
- Problème qu'il résout : ${answers.probleme}
- Cible idéale : ${answers.pourqui}
- Transformation apportée : ${answers.transformation}
- Ce qu'il ne veut jamais dire : ${answers.jamais}
- Son ton naturel : ${answers.ton}
Génère un profil de cible LinkedIn complet et percutant structuré ainsi :
## 🎯 Ta cible en une phrase
Une phrase courte, mémorable, qui résume parfaitement à qui tu parles.
## 👤 Portrait de ta cible idéale
Décris concrètement cette personne : qui elle est, ce qu'elle vit, ses frustrations quotidiennes, ses aspirations. Sois vivant et précis.
## 💬 Ce qu'elle dit (et pense en secret)
3 à 5 phrases que ta cible se dit intérieurement. En langage naturel, pas corporate.
## 📝 Tes sujets de posts LinkedIn
5 à 7 angles de contenu qui vont résonner fort avec cette cible. Pour chaque angle, donne un exemple de titre de post accrocheur.
## 🚀 Instructions pour ton assistant Claude
Un texte prêt à coller dans les instructions de ton Project Claude, qui résume ton positionnement, ta cible, ton ton et tes lignes rouges.
Sois direct, concret, sans jargon marketing. Écris comme si tu parlais à quelqu'un d'intelligent qui n'a pas de temps à perdre.`;
}
export default function TrouveTaCible() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const step = steps[current];
  const progress = (current / steps.length) * 100;
  const isLastQuestion = current + 1 >= steps.length;
  function handleNext() {
    if (!value.trim()) return;
    const newAnswers = { ...answers, [step.id]: value.trim() };
    setAnswers(newAnswers);
    setValue("");
    if (isLastQuestion) {
      setShowEmail(true);
    } else {
      setCurrent(current + 1);
    }
  }
  async function handleGenerate(finalAnswers) {
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
      setResult(data.text);
    } catch (e) {
      setError("Une erreur s'est produite. Réessaie dans quelques secondes.");
    } finally {
      setLoading(false);
    }
  }
  function handleEmailSubmit() {
    handleGenerate(answers);
    setShowEmail(false);
  }
  function handleSkipEmail() {
    handleGenerate(answers);
    setShowEmail(false);
  }
  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function handleRestart() {
    setCurrent(0);
    setAnswers({});
    setValue("");
    setEmail("");
    setShowEmail(false);
    setLoading(false);
    setResult(null);
    setError(null);
    setCopied(false);
  }
  // Format markdown-ish result
  function formatResult(text) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <div key={i} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "16px", fontWeight: 700, color: "#e8c547", margin: "24px 0 8px 0" }}>{line.replace("## ", "")}</div>;
      }
      if (line.startsWith("- ") || line.match(/^\d+\./)) {
        return <div key={i} style={{ paddingLeft: "16px", color: "#ccc", lineHeight: 1.7, fontSize: "14px", marginBottom: "4px" }}>{line}</div>;
      }
      if (line.trim() === "") return <div key={i} style={{ height: "6px" }} />;
      return <div key={i} style={{ color: "#bbb", lineHeight: 1.7, fontSize: "14px", marginBottom: "4px" }}>{line}</div>;
    });
  }
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .card { animation: fadeUp 0.4s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus, input:focus { outline: none; border-color: #e8c547 !important; }
        .btn-gold { transition: all 0.2s; }
        .btn-gold:hover { background: #f0d060 !important; transform: translateY(-1px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.06) !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="card" key={result ? "result" : showEmail ? "email" : loading ? "loading" : current} style={{ width: "100%", maxWidth: "640px" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#e8c547", textTransform: "uppercase", fontWeight: 500, marginBottom: "10px" }}>
            Club Smart — Outil LinkedIn
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>
            Trouve ta cible<br /><span style={{ color: "#e8c547" }}>LinkedIn</span>
          </h1>
        </div>
        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spin" style={{ width: "32px", height: "32px", border: "2px solid #222", borderTopColor: "#e8c547", borderRadius: "50%", margin: "0 auto 20px" }} />
            <div style={{ color: "#555", fontSize: "14px", fontWeight: 300 }}>Claude analyse ton profil...</div>
          </div>
        )}
        {/* ERROR */}
        {error && !loading && (
          <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "20px", color: "#ff6b6b", fontSize: "14px", marginBottom: "20px" }}>
            {error}
            <button onClick={handleRestart} className="btn-ghost" style={{ display: "block", marginTop: "12px", background: "transparent", border: "1px solid #333", color: "#666", borderRadius: "6px", padding: "10px 16px", cursor: "pointer", fontSize: "13px" }}>Recommencer</button>
          </div>
        )}
        {/* EMAIL STEP */}
        {showEmail && !loading && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
              Ton profil est prêt à être généré 🎯
            </h2>
            <p style={{ color: "#555", fontSize: "14px", fontWeight: 300, marginBottom: "28px", lineHeight: 1.6 }}>
              Si tu veux recevoir une copie par email, laisse ton adresse. Sinon, clique directement sur Générer.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "14px 16px", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 300, marginBottom: "16px", transition: "border-color 0.2s" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-gold" onClick={handleEmailSubmit} style={{ background: "#e8c547", color: "#0a0a0a", border: "none", borderRadius: "6px", padding: "14px 28px", fontSize: "14px", fontWeight: 500, cursor: "pointer", letterSpacing: "0.5px" }}>
                Générer mon profil →
              </button>
              <button className="btn-ghost" onClick={handleSkipEmail} style={{ background: "transparent", color: "#444", border: "1px solid #222", borderRadius: "6px", padding: "14px 20px", fontSize: "14px", cursor: "pointer" }}>
                Sans email
              </button>
            </div>
          </div>
        )}
        {/* RESULT */}
        {result && !loading && (
          <>
            <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "24px", marginBottom: "20px", maxHeight: "500px", overflowY: "auto" }}>
              {formatResult(result)}
            </div>
            <div style={{ color: "#444", fontSize: "12px", fontStyle: "italic", marginBottom: "20px" }}>
              Copie la section "Instructions pour ton assistant Claude" et colle-la dans ton Project Claude.
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-gold" onClick={handleCopy} style={{ background: copied ? "#e8c547" : "#1a1a1a", color: copied ? "#0a0a0a" : "#e8c547", border: "1px solid #e8c547", borderRadius: "6px", padding: "14px 28px", fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                {copied ? "✓ Copié !" : "Copier tout"}
              </button>
              <button className="btn-ghost" onClick={handleRestart} style={{ background: "transparent", color: "#444", border: "1px solid #222", borderRadius: "6px", padding: "14px 20px", fontSize: "14px", cursor: "pointer" }}>
                Recommencer
              </button>
            </div>
          </>
        )}
        {/* QUESTIONNAIRE */}
        {!showEmail && !loading && !result && !error && (
          <>
            {/* Progress */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#555", fontWeight: 300 }}>Question {current + 1} sur {steps.length}</span>
                <span style={{ fontSize: "13px", color: "#e8c547", fontWeight: 500 }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: "2px", background: "#1e1e1e", borderRadius: "1px" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "#e8c547", borderRadius: "1px", transition: "width 0.4s ease" }} />
              </div>
            </div>
            {/* Question */}
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, color: "#fff", margin: "0 0 8px 0", lineHeight: 1.3 }}>
              {step.question}
            </h2>
            <p style={{ fontSize: "13px", color: "#555", margin: "0 0 20px 0", fontStyle: "italic", fontWeight: 300 }}>{step.hint}</p>
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleNext(); }}
              placeholder={step.placeholder}
              rows={4}
              style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 300, lineHeight: 1.6, resize: "vertical", transition: "border-color 0.2s", marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button className="btn-gold" onClick={handleNext} disabled={!value.trim()} style={{ background: value.trim() ? "#e8c547" : "#2a2a2a", color: value.trim() ? "#0a0a0a" : "#444", border: "none", borderRadius: "6px", padding: "14px 28px", fontSize: "14px", fontWeight: 500, cursor: value.trim() ? "pointer" : "not-allowed", letterSpacing: "0.5px" }}>
                {isLastQuestion ? "Terminer →" : "Suivant →"}
              </button>
              {current > 0 && (
                <button className="btn-ghost" onClick={() => { setCurrent(current - 1); setValue(answers[steps[current - 1].id] || ""); }} style={{ background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "14px 20px", fontSize: "14px", cursor: "pointer" }}>
                  ← Retour
                </button>
              )}
              <span style={{ fontSize: "11px", color: "#333", marginLeft: "auto" }}>⌘ + Entrée</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
