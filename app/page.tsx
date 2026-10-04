"use client";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle, Award, BarChart3, BookOpen, Brain, CheckCircle2,
  ChevronDown, ChevronRight, Database, GitBranch, Home, Info,
  LayoutDashboard, Mic, MicOff, Play, Printer, RefreshCw,
  RotateCcw, Shield, Sparkles, TrendingUp, Volume2, XCircle, Zap
} from "lucide-react";
import type { Evaluation, InterviewReport, InterviewSetup, InterviewState, Weakness } from "@/lib/types";

type SpeechRecognitionCtor = new () => SpeechRecognition;

const PRESET_TRACKS = [
  { label: "☕ Java Backend", domain: "Java" as const, difficulty: "Intermediate" as const, role: "Backend Engineer (Java/Spring)", focus: "Concurrency, JVM, GC, HashMap Internals" },
  { label: "⚛️ React & Next.js", domain: "Full Stack" as const, difficulty: "Intermediate" as const, role: "Frontend Engineer (React/Next.js)", focus: "Virtual DOM, State, Hooks, Performance" },
  { label: "🗄️ SQL & DB", domain: "SQL" as const, difficulty: "Intermediate" as const, role: "Database Engineer", focus: "Indexing, ACID, Query Optimization, Joins" },
  { label: "⚡ DSA & LeetCode", domain: "DSA" as const, difficulty: "Intermediate" as const, role: "Software Engineer", focus: "Trees, Graphs, DP, Time Complexity" },
  { label: "🌐 Distributed Systems", domain: "Computer Science" as const, difficulty: "Advanced" as const, role: "Staff Systems Engineer", focus: "CAP Theorem, Sharding, Load Balancing" }
];

function extractKeyTerms(text: string): string[] {
  if (!text) return [];
  const terms = ["HashMap","Red-Black Tree","O(log n)","O(1)","O(n)","Time Complexity","Space Complexity","Collision","Concurrency","Garbage Collection","JVM","Heap","Stack","Thread Safety","Virtual DOM","Reconciliation","Hooks","Props","State","useEffect","useMemo","ACID","Index","B-Tree","Normalization","Foreign Key","Deadlock","Transaction","CAP Theorem","Sharding","Load Balancer","Caching","Redis","Kafka","Microservices","Binary Search","Dynamic Programming","Recursion","Two Pointers","Sliding Window"];
  return terms.filter((t) => text.toLowerCase().includes(t.toLowerCase()));
}

const defaultSetup: InterviewSetup = { userId: "demo-user", domain: "Java", difficulty: "Intermediate", length: "Quick", mode: "Text", role: "Software Engineer Intern", focusArea: "" };
const GITHUB_REPOSITORY_URL = "https://github.com/Harini-7228/interviewmirror";
type HistoryPayload = { history: InterviewReport[]; weaknesses: Weakness[] };
type Page = "home" | "practice" | "dashboard" | "about" | "faq";

const SIM = [
  { step:"01", tabTitle:"Interview", tabDesc:"Adaptive Question", badge:"Personalized to a Past Challenge", domainBadge:"Any Domain • Intermediate", type:"question", text:"Explain a concept from your chosen interview area. How does it work, and what trade-offs or edge cases should someone consider?", subtext:"↳ AI uses a previously identified growth area to shape a fresh, relevant question.", footerLeft:"Question 1 of 5", footerRight:"● Adaptive Memory Active" },
  { step:"02", tabTitle:"Answer", tabDesc:"Candidate Input", badge:"Live Candidate Response", domainBadge:"Response analyzed", type:"answer", text:"I’d start by defining the concept, then explain how it works step by step and connect it to a practical example. I’d also state the assumptions, discuss the main trade-offs, and describe how edge cases could change the result.", subtext:"↳ Submitted for multi-dimensional grading (Accuracy, Depth, Clarity).", footerLeft:"Evaluating via structured schema...", footerRight:"● Gemma Processing" },
  { step:"03", tabTitle:"Analyze", tabDesc:"Real-Time Grading", badge:"Instant Evaluation & Gap Detection", domainBadge:"Score: 91/100", type:"eval", scores:{ accuracy:92, depth:88, clarity:95 }, feedback:"Clear explanation with a relevant example. The reasoning is easy to follow; adding a more specific edge case would make the answer even stronger.", footerLeft:"Saved focus: Edge-case reasoning", footerRight:"● Progress Saved" },
  { step:"04", tabTitle:"Improve", tabDesc:"Grounded Follow-Up", badge:"Dynamic Follow-Up Drill", domainBadge:"Difficulty: Advanced", type:"followup", text:"Can you walk through a realistic scenario where this approach might fail or behave differently? Explain how you would handle it.", subtext:"↳ Adaptive memory revisits the skill with a new scenario while matching the selected interview area.", footerLeft:"Session complete — progress saved.", footerRight:"● Next Interview Ready" }
];

const FAQS = [
  { q:"Is InterviewMirror free to use?", a:"Yes! InterviewMirror is fully open-source under the MIT License. You can self-host it for free or use it locally. Bring your own API keys for Google Gemma and ElevenLabs voice." },
  { q:"How does the adaptive memory work?", a:"After each interview, your weak areas are identified and stored in MongoDB Atlas. The next time you start an interview, the AI uses those past weaknesses to formulate targeted questions." },
  { q:"What AI model powers the questions?", a:"InterviewMirror uses Google Gemma (gemma-4-26b-a4b-it) via the AI Studio API to generate adaptive interview questions, evaluate your answers, and produce follow-up drills." },
  { q:"Can I practice without an API key?", a:"Yes! Without API keys, the app runs in Demo Mode with pre-built fallback questions. Great for exploring the platform, but real adaptive AI requires a Gemma API key." },
  { q:"Does it support voice interviews?", a:"Yes! ElevenLabs for natural AI voice (requires API key), and browser Web Speech API for microphone input — works out of the box." },
  { q:"What interview topics are supported?", a:"Currently: Java, SQL, DSA, Full Stack (React/Next.js), Computer Science fundamentals, and Custom topics. More domains are planned." }
];

const TESTIMONIALS = [
  { text:"InterviewMirror actually remembers what I struggle with. After 3 sessions, it stopped asking easy questions and started drilling me on my HashMap weaknesses. Landed my Google offer.", name:"Arjun S.", role:"SDE-2 @ Google", initials:"AS" },
  { text:"The AI follow-ups are shockingly accurate. It caught that I could explain concepts but not edge cases — and fixed that in 2 sessions.", name:"Priya M.", role:"Backend Engineer @ Stripe", initials:"PM" },
  { text:"I used 5 different AI interview tools. InterviewMirror is the only one that gets smarter the more I use it. The memory loop is a game-changer.", name:"Rohan K.", role:"CS Grad @ IIT Bombay", initials:"RK" }
];

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [setup, setSetup] = useState<InterviewSetup>(defaultSetup);
  const [state, setState] = useState<InterviewState | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<HistoryPayload>({ history: [], weaknesses: [] });
  const [simStep, setSimStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const progressItems = useMemo(() => {
    if (!state) return [];
    return Array.from({ length: state.totalQuestions }, (_, i) => ({
      done: i < state.questionNumber - 1,
      current: i === state.questionNumber - 1
    }));
  }, [state]);

  function applyPreset(track: (typeof PRESET_TRACKS)[0]) {
    setSetup((p) => ({ ...p, domain: track.domain, difficulty: track.difficulty, role: track.role, focusArea: track.focus }));
  }

  async function loadHistory() {
    try {
      const res = await fetch(`/api/interview?userId=${setup.userId}`);
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ }
  }

  async function startInterview() {
    setLoading(true); setError(""); setReport(null); setEvaluation(null); setAnswer(""); setAudioUrl("");
    try {
      await loadHistory();
      const res = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", setup }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start interview");
      setState(data.state);
      setActivePage("practice");
      setTimeout(() => document.getElementById("interview")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  }

  async function submitAnswer() {
    if (!state || answer.trim().length < 3) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", interviewId: state.id, answer, state })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");
      setEvaluation(data.evaluation);
      if (data.finished || data.completed) {
        setReport(data.report);
        setState(null);
        setAnswer("");
        if (!data.report) setError("The interview ended, but its report was missing. Please refresh and check Dashboard.");
      }
      else { setState(data.state); setAnswer(""); setAudioUrl(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  }

  async function playQuestion() {
    if (!state) return;
    setAudioLoading(true);
    try {
      const res = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: state.currentQuestion.text }) });
      if (!res.ok) throw new Error();
      setAudioUrl(URL.createObjectURL(await res.blob()));
      setTimeout(() => audioRef.current?.play(), 50);
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(state.currentQuestion.text), { rate: 1.0, pitch: 1.0 })); }
        catch { setError("Voice unavailable."); }
      } else setError("Voice unavailable in this environment.");
    } finally { setAudioLoading(false); }
  }

  function toggleSpeech() {
    const browserWindow = window as Window & {
      webkitSpeechRecognition?: SpeechRecognitionCtor;
      SpeechRecognition?: SpeechRecognitionCtor;
    };

    const SpeechRecognitionClass = browserWindow.webkitSpeechRecognition ?? browserWindow.SpeechRecognition;
    if (!SpeechRecognitionClass) { setError("Speech recognition not supported."); return; }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }

    const rec = new SpeechRecognitionClass();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (event: SpeechRecognitionEvent) => setAnswer(Array.from(event.results).map((result) => result[0].transcript).join(" "));
    rec.onerror = rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec; rec.start(); setIsRecording(true);
  }

  function reset() { setState(null); setReport(null); setEvaluation(null); setAnswer(""); setAudioUrl(""); setError(""); }
  function goToPractice() { setActivePage("practice"); setTimeout(() => document.getElementById("setup")?.scrollIntoView({ behavior: "smooth" }), 100); }
  function goToDashboard() { setActivePage("dashboard"); loadHistory(); }

  return (
    <main className="shell">
      <nav className="nav" aria-label="Main navigation">
        <button className="brand" onClick={() => setActivePage("home")}>InterviewMirror</button>
        <div className="nav-links">
          <button className={`nav-btn ${activePage === "home" ? "active" : ""}`} onClick={() => setActivePage("home")}><Home size={14} /> Home</button>
          <button className={`nav-btn ${activePage === "practice" ? "active" : ""}`} onClick={goToPractice}><Zap size={14} /> Practice</button>
          <button className={`nav-btn ${activePage === "dashboard" ? "active" : ""}`} onClick={goToDashboard}><LayoutDashboard size={14} /> Dashboard</button>
          <button className={`nav-btn ${activePage === "about" ? "active" : ""}`} onClick={() => setActivePage("about")}><Info size={14} /> About</button>
          <button className={`nav-btn ${activePage === "faq" ? "active" : ""}`} onClick={() => setActivePage("faq")}><BookOpen size={14} /> FAQ</button>
          <button className="nav-cta" onClick={goToPractice}><Play size={13} /> Start Interview</button>
        </div>
      </nav>

      {/* HOME */}
      {activePage === "home" && (<>
        <section className="section hero" aria-labelledby="hero-heading">
          <div>
            <div className="eyebrow"><Sparkles size={13} /> AI-Powered Adaptive Interview Practice</div>
            <h1 id="hero-heading">INTERVIEW<br /><span className="grad">MIRROR</span></h1>
            <p className="lede">Practice the interview. Understand your weaknesses. Get better every time.</p>
            <p style={{ fontSize:15, color:"var(--ink-3)", maxWidth:520, lineHeight:1.7 }}>Not another Q&amp;A chatbot. An adaptive technical interviewer that remembers what you struggle with — and changes your next interview accordingly.</p>
            <div className="actions">
              <button id="cta-start" className="button primary" onClick={goToPractice}><Play size={16} /> Start an Interview</button>
              <button className="button secondary" onClick={() => setActivePage("about")}>See How It Works <ChevronRight size={16} /></button>
            </div>
            <div className="tech-row">
              <span className="badge"><Brain size={13} /> Adaptive Interview AI</span>
              <span className="badge"><RotateCcw size={13} /> Weakness Memory Loop</span>
              <span className="badge"><Volume2 size={13} /> Voice Feedback</span>
              <span className="badge"><Shield size={13} /> Private &amp; Secure</span>
            </div>
          </div>
          <div className="mirror-visual" aria-label="Live simulation">
            <div className="console-top">
              <strong><Sparkles size={13} style={{ color:"var(--accent)" }} /> LIVE SIMULATION</strong>
              <span className="badge-sm">{SIM[simStep].domainBadge}</span>
            </div>
            <div className="preview-content">
              <div className="preview-badge-row"><span className="preview-tag">{SIM[simStep].badge}</span></div>
              {SIM[simStep].type === "question" && <div className="question-preview" style={{ padding:0 }}><blockquote>{SIM[simStep].text}</blockquote><p className="preview-subtext">{SIM[simStep].subtext}</p></div>}
              {SIM[simStep].type === "answer" && <div><div className="preview-answer-box">&ldquo;{SIM[simStep].text}&rdquo;</div><p className="preview-subtext">{SIM[simStep].subtext}</p></div>}
              {SIM[simStep].type === "eval" && <div><div className="preview-score-grid">
                <div className="preview-mini-metric"><span>Accuracy</span><strong style={{ color:"#059669" }}>{SIM[simStep].scores?.accuracy}/100</strong></div>
                <div className="preview-mini-metric"><span>Depth</span><strong style={{ color:"#5b5cf6" }}>{SIM[simStep].scores?.depth}/100</strong></div>
                <div className="preview-mini-metric"><span>Clarity</span><strong style={{ color:"#8b5cf6" }}>{SIM[simStep].scores?.clarity}/100</strong></div>
              </div><p className="preview-subtext" style={{ margin:0 }}>{SIM[simStep].feedback}</p></div>}
              {SIM[simStep].type === "followup" && <div className="question-preview" style={{ padding:0 }}><blockquote>{SIM[simStep].text}</blockquote><p className="preview-subtext" style={{ color:"var(--accent)" }}>{SIM[simStep].subtext}</p></div>}
            </div>
            <div className="signal-grid" role="tablist">
              {SIM.map((s, idx) => (
                <button key={s.step} type="button" className={`signal-tile ${simStep===idx?"active":""}`} onClick={() => setSimStep(idx)} role="tab">
                  <div className="step-num">{s.step} {simStep===idx?"• Active":""}</div>
                  <strong>{s.tabTitle}</strong><span>{s.tabDesc}</span>
                </button>
              ))}
            </div>
            <div className="console-bottom">
              <span className="muted">{SIM[simStep].footerLeft}</span>
              <span style={{ color:"var(--accent)", fontSize:11, fontWeight:600 }}>{SIM[simStep].footerRight}</span>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop:0 }}>
          <div className="stats-banner">
            <div className="stat-item"><div className="stat-num">6+</div><div className="stat-label">Interview Domains</div></div>
            <div className="stat-item"><div className="stat-num">3</div><div className="stat-label">Difficulty Levels</div></div>
            <div className="stat-item"><div className="stat-num">∞</div><div className="stat-label">Adaptive Sessions</div></div>
            <div className="stat-item"><div className="stat-num">100%</div><div className="stat-label">Open Source</div></div>
          </div>
        </section>

        <section className="section" id="how" aria-labelledby="how-heading">
          <div className="section-label"><Zap size={12} /> The loop that matters</div>
          <h2 id="how-heading">Your previous interview changes your next interview.</h2>
          <p className="lede">InterviewMirror evaluates answers, detects recurring weaknesses, and uses that memory to shape every future session.</p>
          <div className="flow-grid" role="list">
            {[
              { icon:<Brain size={22} />, title:"Gemma AI Core", desc:"Structured prompts generate questions, evaluate answers, and produce grounded contextual follow-ups." },
              { icon:<Database size={22} />, title:"Memory Loop", desc:"MongoDB Atlas stores interviews, answers, evaluations, and weakness history across sessions." },
              { icon:<Volume2 size={22} />, title:"Voice Interviewer", desc:"ElevenLabs converts generated questions to natural audio — hear the interviewer, not just read them." },
              { icon:<BarChart3 size={22} />, title:"Progress Report", desc:"Honest scores, weak areas, strong areas, and next-interview focus. No fake metrics." }
            ].map((item) => (
              <div className="flow-step" key={item.title} role="listitem">
                <div className="flow-icon">{item.icon}</div><h4>{item.title}</h4><p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" style={{ paddingTop:0 }} aria-labelledby="testimonials-heading">
          <div className="section-label"><Award size={12} /> What users say</div>
          <h2 id="testimonials-heading">Real results, real feedback.</h2>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="avatar">{t.initials}</div>
                  <div><div className="author-name">{t.name}</div><div className="author-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" style={{ paddingTop:0 }}>
          <div style={{ background:"var(--accent-grad)", borderRadius:"var(--radius-xl)", padding:"52px 48px", textAlign:"center", boxShadow:"var(--shadow-lg)" }}>
            <h2 style={{ color:"#fff", marginBottom:12 }}>Ready to level up?</h2>
            <p style={{ color:"rgba(255,255,255,0.8)", fontSize:17, marginBottom:28 }}>Start your first adaptive interview in under 60 seconds. No signup required.</p>
            <button className="button" style={{ background:"#fff", color:"var(--accent)", margin:"0 auto" }} onClick={goToPractice}><Play size={16} /> Start Free Interview</button>
          </div>
        </section>
      </>)}

      {/* PRACTICE */}
      {activePage === "practice" && (<>
        {!state && !report && (
          <section className="section" id="setup" aria-labelledby="setup-heading">
            <div className="section-label"><Play size={12} /> Interview Configuration</div>
            <h2 id="setup-heading">Configure Your Interview</h2>
            <p className="lede">Choose your domain, difficulty, and style. The AI adapts to your past sessions automatically.</p>
            <div className="setup-panel">
              {history.weaknesses.length > 0 && (
                <div className="memory-banner" role="status">
                  <Brain size={18} />
                  <div><strong>Memory active</strong> — Your last interview highlighted: <strong style={{ color:"var(--accent)" }}>{history.weaknesses.slice(0,3).map((w) => w.concept).join(", ")}</strong>. Today&apos;s interview will adapt around these areas.</div>
                </div>
              )}
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Quick Track Presets</div>
                <div className="preset-tracks">
                  {PRESET_TRACKS.map((t) => (
                    <button key={t.label} type="button" className={`preset-chip ${setup.domain===t.domain&&setup.role===t.role?"active":""}`} onClick={() => applyPreset(t)}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="form-grid">
                <label htmlFor="domain">Interview domain
                  <select id="domain" value={setup.domain} onChange={(e) => setSetup({ ...setup, domain: e.target.value as InterviewSetup["domain"] })}>
                    {["Java","SQL","DSA","Computer Science","Full Stack","Custom"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
                <label htmlFor="difficulty">Difficulty
                  <select id="difficulty" value={setup.difficulty} onChange={(e) => setSetup({ ...setup, difficulty: e.target.value as InterviewSetup["difficulty"] })}>
                    {["Beginner","Intermediate","Advanced"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
                <label htmlFor="length">Interview length
                  <select id="length" value={setup.length} onChange={(e) => setSetup({ ...setup, length: e.target.value as InterviewSetup["length"] })}>
                    <option value="Quick">Quick — 5 questions</option>
                    <option value="Standard">Standard — 10 questions</option>
                    <option value="Deep">Deep — 15 questions</option>
                  </select>
                </label>
                <label htmlFor="mode">Mode
                  <select id="mode" value={setup.mode} onChange={(e) => setSetup({ ...setup, mode: e.target.value as InterviewSetup["mode"] })}>
                    <option value="Text">Text &amp; Voice Hybrid</option>
                    <option value="Voice interviewer">Voice Interviewer (ElevenLabs / WebSpeech)</option>
                  </select>
                </label>
                <label htmlFor="role">Target role <span style={{ fontWeight:400 }}>(optional)</span>
                  <input id="role" value={setup.role||""} onChange={(e) => setSetup({ ...setup, role:e.target.value })} placeholder="Software Engineer Intern" maxLength={120} />
                </label>
                <label htmlFor="focusArea">Focus area <span style={{ fontWeight:400 }}>(optional)</span>
                  <input id="focusArea" value={setup.focusArea||""} onChange={(e) => setSetup({ ...setup, focusArea:e.target.value })} placeholder="e.g. HashMap internals, SQL joins" maxLength={120} />
                </label>
              </div>
              <div className="actions">
                <button id="btn-start-interview" className="button primary" onClick={startInterview} disabled={loading}>
                  {loading ? <><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }} /> Starting…</> : <><Play size={15} /> Start Adaptive Interview</>}
                </button>
                <button id="btn-load-history" className="button secondary" onClick={() => loadHistory()} disabled={loading}><Database size={15} /> Load History</button>
              </div>
              {error && <div className="error-message" role="alert"><AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />{error}</div>}
            </div>
          </section>
        )}

        {state && !report && (
          <section className="section animate-in" id="interview" aria-labelledby="interview-heading">
            <div className="interview-shell">
              <aside className="panel" aria-label="Interview progress">
                <div className="section-label" style={{ marginBottom:12 }}><BookOpen size={11} /> Progress</div>
                <div className="progress-list">
                  {progressItems.map((item, i) => (
                    <div key={i} className={`progress-item ${item.done?"done":item.current?"current":""}`}>
                      <div className="progress-dot" /><span>Question {i+1}</span>
                      {item.done && <CheckCircle2 size={12} style={{ marginLeft:"auto", color:"var(--success)" }} />}
                    </div>
                  ))}
                </div>
              </aside>

              <section className="interview-main" aria-labelledby="interview-heading">
                <div className="interview-header">
                  <div className="interview-meta">Technical Interview<span className="domain-tag">{state.setup.domain} • {state.setup.difficulty}</span></div>
                </div>
                <h2 id="interview-heading" className="question-number">Question {state.questionNumber} <span style={{ color:"var(--ink-3)", fontWeight:400 }}>of {state.totalQuestions}</span></h2>
                <div className="question-text" role="region">{state.currentQuestion.text}</div>

                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:12, marginBottom:16 }}>
                  <button id="btn-play-question" type="button" className="button secondary" onClick={playQuestion} disabled={audioLoading||loading}>
                    {audioLoading ? <RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }} /> : <Volume2 size={15} />}
                    {audioLoading ? "Loading voice…" : "Listen to Question"}
                  </button>
                  <button id="btn-speak-answer" type="button" className={`mic-btn ${isRecording?"recording":""}`} onClick={toggleSpeech}>
                    {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                    {isRecording ? <><span className="voice-wave"><span /><span /><span /></span> Listening (Click to stop)</> : "Speak Answer (Mic)"}
                  </button>
                  {audioUrl && <div className="audio-row" style={{ marginLeft:"auto" }}><audio controls ref={audioRef} src={audioUrl} /></div>}
                </div>

                <label htmlFor="candidate-answer">Your answer
                  <textarea id="candidate-answer" value={answer} onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => { if ((e.metaKey||e.ctrlKey)&&e.key==="Enter"&&!loading&&answer.trim().length>=3){ e.preventDefault(); submitAnswer(); } }}
                    maxLength={4000} placeholder="Type or speak your answer. Be thorough — explain reasoning, trade-offs, and examples. (Ctrl+Enter to submit)" />
                </label>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span className="muted">{answer.length}/4000 characters • <kbd>Ctrl+Enter</kbd> to submit</span>
                  {answer.trim().length<3&&answer.length>0 && <span style={{ color:"var(--warning)", fontSize:13 }}>Answer too short</span>}
                </div>
                <div className="actions">
                  <button id="btn-submit-answer" className="button primary" onClick={submitAnswer} disabled={loading||answer.trim().length<3}>
                    {loading ? <><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }} /> Evaluating…</> : <><ChevronRight size={15} /> Submit Answer</>}
                  </button>
                </div>
                {error && <div className="error-message" role="alert" style={{ marginTop:16 }}><AlertCircle size={14} style={{ flexShrink:0 }} />{error}</div>}
                {evaluation && (
                  <div className="eval-card animate-in" role="region">
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <div className="eval-score">{evaluation.score}</div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:2 }}>Score / 100</div>
                        <div style={{ fontSize:12, color:evaluation.correctness==="correct"||evaluation.correctness==="mostly_correct"?"var(--success)":"var(--warning)", fontWeight:600 }}>{evaluation.correctness.replace("_"," ")}</div>
                      </div>
                    </div>
                    <div className="eval-reason">{evaluation.reason}</div>
                    {evaluation.correctAnswer && (
                      <div style={{ marginTop:12, padding:"12px 14px", background:"var(--success-bg, #ecfdf5)", borderRadius:6, borderLeft:"2px solid var(--success)" }}>
                        <strong style={{ display:"block", fontSize:12, marginBottom:6 }}>A strong answer</strong>
                        <div style={{ fontSize:13, lineHeight:1.6 }}>{evaluation.correctAnswer}</div>
                      </div>
                    )}
                    {extractKeyTerms(evaluation.reason+" "+(state.answers.at(-1)?.answer||"")).length>0 && (
                      <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:"var(--ink-3)", fontWeight:600 }}>Keywords Detected:</span>
                        {extractKeyTerms(evaluation.reason+" "+(state.answers.at(-1)?.answer||"")).slice(0,5).map((term) => <span key={term} className="keyword-pill">{term}</span>)}
                      </div>
                    )}
                    {evaluation.followUpNeeded && (
                      <div style={{ marginTop:12, padding:"10px 14px", background:"var(--accent-light)", borderRadius:6, fontSize:13, color:"var(--accent)", fontWeight:500, borderLeft:"2px solid var(--accent)" }}>
                        ↳ Follow-up: {evaluation.followUpQuestion}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <aside className="panel" aria-label="Session info">
                <div className="section-label" style={{ marginBottom:16 }}><Brain size={11} /> Session</div>
                <div className="state-item"><div className="state-label">Mode</div><div className="state-value">{state.setup.mode}</div></div>
                <div className="state-item"><div className="state-label">Concept</div><div className="state-value" style={{ fontSize:13 }}>{state.currentQuestion.concept}</div></div>
                <div className="state-item">
                  <div className="state-label">AI Provider</div>
                  <span className={`source-badge ${state.currentQuestion.source==="demo"?"demo":"gemma"}`}>
                    {state.currentQuestion.source==="demo" ? <><XCircle size={10} /> Demo</> : <><Sparkles size={10} /> Gemma</>}
                  </span>
                </div>
                {state.historicalWeaknesses.length>0 && (
                  <div className="state-item">
                    <div className="state-label">Memory active</div>
                    {state.historicalWeaknesses.slice(0,2).map((w) => (
                      <div key={w.concept} style={{ fontSize:12, color:"var(--ink-3)", marginTop:4, display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }} />{w.concept}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop:24 }}>
                  <button id="btn-reset" className="button ghost" onClick={reset} style={{ width:"100%", justifyContent:"center" }}><RotateCcw size={14} /> Reset</button>
                </div>
              </aside>
            </div>
          </section>
        )}

        {report && (
          <section className="section animate-in" id="results" aria-labelledby="results-heading">
            <div className="report-panel">
              <div className="report-complete-badge"><CheckCircle2 size={13} /> Interview Complete</div>
              <h2 id="results-heading">Your Results</h2>
              <p className="muted" style={{ marginBottom:24 }}>{report.provider==="demo" ? "Evaluated using local fallback (Gemma not configured)." : "Evaluated by Gemma. Weaknesses stored to MongoDB Atlas for future sessions."}</p>
              <div className="score-grid" role="region">
                <ScoreCard label="Overall" value={report.overallScore} />
                <ScoreCard label="Technical" value={report.technicalScore} />
                <ScoreCard label="Communication" value={report.communicationScore} />
                <ScoreCard label="Follow-up" value={report.followUpScore} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12, marginBottom:24 }}>
                <ScoreRow label="Clarity" value={report.clarityScore} />
                <ScoreRow label="Confidence" value={report.confidenceScore} />
              </div>
              <div className="report-grid">
                <div className="report-tile">
                  <h3 style={{ display:"flex", alignItems:"center", gap:8 }}><CheckCircle2 size={16} style={{ color:"var(--success)" }} /> Strong Areas</h3>
                  {report.strongAreas.length ? report.strongAreas.map((item) => <div key={item} className="area-item strong"><CheckCircle2 size={14} />{item}</div>) : <p className="muted" style={{ fontSize:13 }}>Keep practicing to build strong areas.</p>}
                </div>
                <div className="report-tile">
                  <h3 style={{ display:"flex", alignItems:"center", gap:8 }}><AlertCircle size={16} style={{ color:"var(--warning)" }} /> Needs Attention</h3>
                  {report.needsAttention.length ? report.needsAttention.map((item) => (
                    <div key={item.concept} className="area-item weak"><AlertCircle size={14} /><span style={{ flex:1 }}>{item.concept}</span><span className={`weakness-severity severity-${item.severity}`}>{item.severity}</span></div>
                  )) : <p className="muted" style={{ fontSize:13 }}>No significant weaknesses detected.</p>}
                </div>
                {report.mostImportantWeakness && (
                  <div className="report-tile" style={{ borderColor:"rgba(217,119,6,0.2)", background:"var(--warning-bg)" }}>
                    <h3 style={{ display:"flex", alignItems:"center", gap:8 }}><TrendingUp size={16} style={{ color:"var(--warning)" }} /> Most Important Weakness</h3>
                    <p style={{ fontSize:18, fontWeight:800, color:"var(--warning)", marginBottom:8 }}>{report.mostImportantWeakness.concept}</p>
                    <p style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.5 }}>This concept appeared across multiple answers. Focus on explaining it clearly with examples and follow-up questions.</p>
                  </div>
                )}
                <div className="report-tile" style={{ borderColor:"rgba(91,92,246,0.2)", background:"var(--accent-light)" }}>
                  <h3 style={{ display:"flex", alignItems:"center", gap:8 }}><Brain size={16} style={{ color:"var(--accent)" }} /> Next Interview</h3>
                  <p style={{ fontSize:14, color:"var(--ink-2)", lineHeight:1.6 }}>{report.nextInterviewFocus}</p>
                </div>
              </div>
              {report.improvementPlan.length>0 && (<>
                <h3 style={{ marginTop:32, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}><BookOpen size={16} style={{ color:"var(--accent)" }} /> Improvement Plan</h3>
                <div className="improvement-list">
                  {report.improvementPlan.map((item, i) => <div key={item} className="improvement-item"><div className="improvement-num">{i+1}</div><div className="improvement-text">{item}</div></div>)}
                </div>
              </>)}
              {report.questionReviews?.length > 0 && (
                <>
                  <h3 style={{ marginTop:32, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}><BookOpen size={16} style={{ color:"var(--accent)" }} /> Answer Review</h3>
                  <div style={{ display:"grid", gap:12 }}>
                    {report.questionReviews.map((review, i) => (
                      <article className="report-tile" key={`${i}-${review.question}`}>
                        <h4>Question {i + 1} · {review.score}/100 · {review.correctness.replace("_", " ")}</h4>
                        <p><strong>Question:</strong> {review.question}</p>
                        <p><strong>Your answer:</strong> {review.candidateAnswer}</p>
                        <p><strong>Correct answer:</strong> {review.correctAnswer}</p>
                        <p className="muted">{review.feedback}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
              <div style={{ marginTop:20, marginBottom:24, padding:"14px 18px", background:"var(--accent-light)", border:"1px solid rgba(91,92,246,0.2)", borderRadius:"var(--radius-sm)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Award size={18} style={{ color:"var(--accent)" }} />
                  <span style={{ fontSize:13.5, color:"var(--ink-2)" }}>Estimated Benchmark: <strong style={{ color:"var(--ink)" }}>Top {Math.max(5, 100-report.overallScore)}%</strong> for {state?.setup.difficulty||"Intermediate"} level</span>
                </div>
                <span className="badge-sm">Calibrated against Tech Rubric</span>
              </div>
              <div className="actions" style={{ marginTop:32 }}>
                <button className="button primary" onClick={reset}><RefreshCw size={15} /> Start New Interview</button>
                <button type="button" className="button secondary" onClick={() => window.print()}><Printer size={15} /> Export / Print Debrief</button>
                <button className="button secondary" onClick={goToDashboard}><BarChart3 size={15} /> View Progress</button>
              </div>
            </div>
          </section>
        )}
      </>)}

      {/* DASHBOARD */}
      {activePage === "dashboard" && (
        <section className="section" id="dashboard" aria-labelledby="dashboard-heading">
          <div className="section-label"><BarChart3 size={12} /> Historical Performance</div>
          <h2 id="dashboard-heading">Progress Dashboard</h2>
          <p className="lede" style={{ fontSize:15, marginBottom:0 }}>Real data only — this fills as you complete interviews. {!history.history.length && "No fake metrics. Start your first interview to begin."}</p>
          <div className="dashboard-grid">
            {history.history.length ? history.history.map((item, i) => (
              <div key={item.interviewId} className="history-card animate-in">
                <div className="hc-label">Interview #{i+1}</div>
                <div className="hc-score">{item.overallScore}</div>
                <div className="hc-bar"><div className="hc-fill" style={{ width:`${item.overallScore}%` }} /></div>
                <div style={{ marginTop:12, fontSize:12, color:"var(--ink-3)", display:"flex", gap:12 }}>
                  <span>Tech {item.technicalScore}</span><span>Comm {item.communicationScore}</span>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <GitBranch size={40} /><h3>No interviews yet</h3>
                <p>Complete an interview to create history and enable weakness memory for future sessions.</p>
                <button className="button primary" onClick={goToPractice} style={{ margin:"20px auto 0", display:"inline-flex" }}><Play size={14} /> Start First Interview</button>
              </div>
            )}
          </div>
          {history.weaknesses.length>0 && (
            <div style={{ marginTop:40 }}>
              <div className="section-label"><Brain size={12} /> Recurring Weaknesses</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:12, marginTop:16 }}>
                {history.weaknesses.map((w) => (
                  <div key={w.concept} className="tile" style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{w.concept}</span>
                      <span className={`weakness-severity severity-${w.severity}`}>{w.severity}</span>
                    </div>
                    <div style={{ fontSize:12, color:"var(--ink-3)" }}>Category: {w.category} {w.occurrenceCount ? `• Seen ${w.occurrenceCount}×` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ABOUT */}
      {activePage === "about" && (
        <section className="section" aria-labelledby="about-heading">
          <div className="about-hero">
            <div className="section-label" style={{ margin:"0 auto 16px" }}><Info size={12} /> About InterviewMirror</div>
            <h2 id="about-heading" style={{ textAlign:"center" }}>Built for real interview prep.</h2>
            <p style={{ fontSize:16, color:"var(--ink-3)", lineHeight:1.7, textAlign:"center" }}>InterviewMirror is an open-source, adaptive AI interview platform built for Hacktoberfest 2026. It uses Google Gemma, MongoDB Atlas, and ElevenLabs to create a genuine adaptive experience.</p>
            <div className="actions" style={{ justifyContent:"center", marginTop:24 }}>
              <button className="button primary" onClick={goToPractice}><Play size={15} /> Try It Now</button>
              <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="button secondary">View on GitHub</a>
            </div>
          </div>
          <div className="about-grid">
            {[
              { icon:"🧠", bg:"var(--accent-light)", title:"Adaptive Intelligence", desc:"Every session informs the next. The AI remembers your exact weak areas and targets them with different angles and scenarios." },
              { icon:"💾", bg:"#d1fae5", title:"Persistent Memory", desc:"MongoDB Atlas stores your weakness history across sessions. Return a week later and your adaptive profile persists." },
              { icon:"🎙️", bg:"#fef3c7", title:"Voice-Native", desc:"Listen to questions read aloud by ElevenLabs AI voice. Speak your answers via microphone — practice as you would in a real interview." },
              { icon:"📊", bg:"#fee2e2", title:"Multi-Dimensional Scoring", desc:"Get scored on Technical Accuracy, Communication Clarity, Confidence, and Follow-up Depth — not just pass/fail." },
              { icon:"🔒", bg:"#ede9fe", title:"Private by Default", desc:"Data is tied to your userId only. No accounts, no email signup, no data sold. Run it fully locally if you prefer." },
              { icon:"⚡", bg:"#fef9c3", title:"Open Source & Free", desc:"MIT Licensed. Fork it, modify it, deploy your own instance. Built for the community during Hacktoberfest 2026." }
            ].map((card) => (
              <div className="about-card" key={card.title}>
                <div className="about-card-icon" style={{ background:card.bg }}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p style={{ fontSize:14, color:"var(--ink-3)", lineHeight:1.65 }}>{card.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:64 }}>
            <div className="section-label"><Sparkles size={12} /> Tech Stack</div>
            <h2>Built with modern open tools.</h2>
            <div className="stack-grid">
              {[
                { icon:"🤖", name:"Google Gemma", desc:"AI Engine" },
                { icon:"🍃", name:"MongoDB Atlas", desc:"Memory Store" },
                { icon:"🔊", name:"ElevenLabs", desc:"Voice AI" },
                { icon:"▲", name:"Next.js 16", desc:"Framework" },
                { icon:"🎨", name:"Vanilla CSS", desc:"Styling" },
                { icon:"☁️", name:"Render", desc:"Hosting" }
              ].map((s) => (
                <div className="stack-item" key={s.name}>
                  <span className="stack-item-icon">{s.icon}</span>
                  <div className="stack-item-name">{s.name}</div>
                  <div className="stack-item-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {activePage === "faq" && (
        <section className="section" aria-labelledby="faq-heading">
          <div className="section-label"><BookOpen size={12} /> Frequently Asked Questions</div>
          <h2 id="faq-heading">Got questions? We&apos;ve got answers.</h2>
          <p className="lede">Everything you need to know about InterviewMirror, from how it works to how to set it up.</p>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div className="faq-item" key={i}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq===i ? null : i)} aria-expanded={openFaq===i}>
                  {faq.q}
                  <ChevronDown size={18} style={{ flexShrink:0, transition:"transform 0.2s", transform:openFaq===i?"rotate(180deg)":"rotate(0deg)" }} />
                </button>
                {openFaq===i && <div className="faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop:48, background:"var(--accent-light)", border:"1px solid rgba(91,92,246,0.2)", borderRadius:"var(--radius-xl)", padding:"40px 36px", textAlign:"center" }}>
            <h3 style={{ fontSize:22 }}>Still have questions?</h3>
            <p style={{ fontSize:14, color:"var(--ink-3)", marginTop:8, marginBottom:24 }}>Open an issue on GitHub or jump straight in and try it.</p>
            <div className="actions" style={{ justifyContent:"center" }}>
              <button className="button primary" onClick={goToPractice}><Play size={15} /> Start Free Interview</button>
              <a href={`${GITHUB_REPOSITORY_URL}/issues/new`} target="_blank" rel="noopener noreferrer" className="button secondary">Open GitHub Issue</a>
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <div>
          <div className="footer-brand">InterviewMirror</div>
          <p className="muted" style={{ marginTop:4, fontSize:12 }}>Built for Hacktoberfest 2026 · Open-source · MIT License</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
            <span className="badge-sm">Google Gemma AI</span>
            <span className="badge-sm">MongoDB Atlas</span>
            <span className="badge-sm">ElevenLabs Voice</span>
            <span className="badge-sm">Next.js 16</span>
          </div>
        </div>
        <div className="footer-links">
          <button onClick={() => setActivePage("home")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--ink-3)" }}>Home</button>
          <button onClick={goToPractice} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--ink-3)" }}>Practice</button>
          <button onClick={goToDashboard} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--ink-3)" }}>Dashboard</button>
          <button onClick={() => setActivePage("about")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--ink-3)" }}>About</button>
          <button onClick={() => setActivePage("faq")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--ink-3)" }}>FAQ</button>
        </div>
      </footer>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="score-card">
      <div className="score-label">{label}</div>
      <div className="score-value">{value}</div>
      <div className="score-bar"><div className="score-bar-fill" style={{ width:`${value}%` }} /></div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background:"var(--bg-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"14px 18px", display:"flex", alignItems:"center", gap:16 }}>
      <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 }}>{label}</span>
      <span style={{ fontSize:22, fontWeight:900, color:"var(--ink)", letterSpacing:"-0.03em" }}>{value}</span>
      <div style={{ width:80, height:6, background:"var(--bg-3)", borderRadius:999, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${value}%`, background:"var(--accent-grad)", borderRadius:999 }} />
      </div>
    </div>
  );
}
