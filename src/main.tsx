import {OrganizationPanel, type SavedOrganization} from "./OrganizationPanel";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Layers,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Plus,
  Check,
  Search,
  ChevronRight,
  FileText,
  ShieldCheck,
  LogOut,
  X,
  ArrowLeft,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  resources,
  initialHandoffs,
  status,
  manual,
  answer,
  type Handoff,
  type Resource,
} from "./data";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./style.css";
import { ErrorBoundary } from "./ErrorBoundary";
import { requestAi, isAiManual, type AiManual } from "./ai";
import { UploadPanel } from "./UploadPanel";
import {
  listDocuments,
  deleteHandoffDocuments,
  downloadOriginal,
  type UploadRecord,
} from "./documents";
import { AiControls } from "./AiControls";
type Page = "home" | "signin" | "dashboard" | "handoff" | "ask";
const storageKey = "handoff-demo-v1";
function load(key = storageKey, fallback = initialHandoffs): Handoff[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    if (
      Array.isArray(v) &&
      v.every(
        (h) =>
          h &&
          [
            "id",
            "name",
            "role",
            "department",
            "type",
            "recipient",
            "responsibilities",
            "due",
          ].every((k) => typeof h[k] === "string") &&
          Array.isArray(h.selected) &&
          h.selected.every((s: unknown) => typeof s === "string") &&
          typeof h.generated === "boolean" &&
          typeof h.approved === "boolean",
      )
    )
      return v.map(({ aiManual, summary, ...record }) => ({
        ...record,
        ...(isAiManual(aiManual) ? { aiManual } : {}),
        ...(summary &&
        typeof summary.text === "string" &&
        typeof summary.model === "string" &&
        Array.isArray(summary.sources) &&
        summary.sources.every(
          (source: Resource) =>
            source &&
            ["id", "title", "category", "text"].every(
              (key) =>
                typeof (source as unknown as Record<string, unknown>)[key] ===
                "string",
            ),
        )
          ? { summary }
          : {}),
      }));
  } catch {}
  return fallback;
}
function App() {
  useEffect(() => {
    window.dispatchEvent(new Event("handoff:ready"));
  }, []);
  const [page, setPage] = useState<Page>("home");
  const [workspaceKind, setWorkspaceKind] = useState<"demo" | "files">("demo");
  const [items, setItems] = useState<Handoff[]>(() => load());
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const workspaceRef = React.useRef(workspaceKind);
  workspaceRef.current = workspaceKind;
  const [active, setActive] = useState("h1");
  const [tab, setTab] = useState("Overview");
  const [create, setCreate] = useState(false);
  const [source, setSource] = useState<Resource | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All handoffs");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [useGemini, setUseGemini] = useState(false);
  const [busy, setBusy] = useState(false);
  const activeHandoffRef = React.useRef(active);
  activeHandoffRef.current = active;
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState("");
  const [importing,setImporting] = useState(false);
  const [deleting,setDeleting] = useState(false);
  const [organization,setOrganization] = useState<SavedOrganization>();
  const [fileConsent, setFileConsent] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setUploads([]);
    setFilesLoading(true);
    setFilesError("");
    setFileConsent(false);
    listDocuments(active)
      .then((records) => {
        if (!cancelled) setUploads(records);
      })
      .catch((error) => {
        if (!cancelled) setFilesError(error.message);
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);
  const library = [
    ...(workspaceKind === "demo" ? resources : []),
    ...uploads.map((record) => record.resource),
  ];
  const [aiError, setAiError] = useState("");
  const requestVersion = React.useRef(0);
  const selectedFingerprint =
    items.find((i) => i.id === active)?.selected.join(",") || "";
  useEffect(() => {
    requestVersion.current++;
    setBusy(false);
    setAiError("");
  }, [active, page, useGemini, selectedFingerprint]);
  useEffect(() => {
    setFileConsent(false);
    setOrganization(undefined);
    setChat([]);
  }, [active, selectedFingerprint]);
  const [chat, setChat] = useState<
    { q: string; text: string; sources: Resource[]; model?: string }[]
  >([]);
  // Keep keyboard focus inside open dialogs and restore it when they close.
  useEffect(() => {
    if (!create && !source) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const controls = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,textarea,[tabindex="0"]',
        ) || [],
      );
    controls()
      .find((el) => el.hasAttribute("autofocus"))
      ?.focus();
    if (!dialog?.contains(document.activeElement)) controls()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSource(null);
        setCreate(false);
      }
      if (event.key === "Tab") {
        const list = controls();
        const first = list[0],
          last = list[list.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [create, source]);
  const h = items.find((i) => i.id === active) || items[0] || {...initialHandoffs[0],id:"",selected:[]};
  function save(next: Handoff[], kind = workspaceKind) {
    if (workspaceRef.current === kind) {
      itemsRef.current = next;
      setItems(next);
    }
    // Keep uploaded file bytes/text in IndexedDB; citation references need only metadata here.
    const strip = (source: Resource) =>
      source.origin === "upload"
        ? {
            id: source.id,
            title: source.title,
            category: source.category,
            origin: source.origin,
            text: "",
          }
        : source;
    const stored = next.map((record) => ({
      ...record,
      aiManual: record.aiManual
        ? {
            ...record.aiManual,
            sections: record.aiManual.sections.map((section) => ({
              ...section,
              sources: section.sources.map(strip),
            })),
          }
        : undefined,
      summary: record.summary
        ? { ...record.summary, sources: record.summary.sources.map(strip) }
        : undefined,
    }));
    try {
      localStorage.setItem(
        kind === "demo" ? storageKey : "handoff-files-v1",
        JSON.stringify(stored),
      );
      setNotice("");
    } catch {
      setNotice(
        "Browser storage is unavailable. Changes will last for this session only.",
      );
    }
  }
  function update(
    changes: Partial<Handoff> | ((record: Handoff) => Partial<Handoff>),
  ) {
    const current =
      workspaceRef.current === workspaceKind
        ? itemsRef.current
        : load(workspaceKind === "demo" ? storageKey : "handoff-files-v1", []);
    save(
      current.map((i) =>
        i.id === h.id
          ? { ...i, ...(typeof changes === "function" ? changes(i) : changes) }
          : i,
      ),
      workspaceKind,
    );
  }
  async function removeHandoff(target: Handoff) {
    if (deleting || importing) return;
    if (!window.confirm(`Delete the handoff for ${target.name}? This removes its saved summary, manual and uploaded files from this browser. Downloaded copies are unchanged. This cannot be undone.`)) return;
    const kind=workspaceKind;
    setDeleting(true);
    try {
      const key=kind === "demo" ? storageKey : "handoff-files-v1";
      // Check storage before deleting file bytes; removal only decreases saved metadata size.
      localStorage.setItem(key,localStorage.getItem(key) || JSON.stringify(itemsRef.current));
      await deleteHandoffDocuments(target.id);
      const current=workspaceRef.current === kind ? itemsRef.current : load(key,[]);
      const remaining=current.filter(item=>item.id !== target.id);
      save(remaining,kind);
      if(workspaceRef.current === kind && activeHandoffRef.current === target.id){
        requestVersion.current++;setBusy(false);setChat([]);setUploads([]);setOrganization(undefined);
        setActive(remaining[0]?.id || "");setSource(null);nav("dashboard");
      }
    } catch(error){setNotice(error instanceof Error ? error.message : "Could not delete handoff.");}
    finally{setDeleting(false);}
  }
  function open(id: string) {
    setActive(id);
    setTab("Overview");
    setPage("handoff");
    setChat([]);
  }
  function nav(p: Page) {
    setPage(p);
    setNotice("");
  }
  async function ask(q: string) {
    if (!q.trim() || busy) return;
    if (!useGemini) {
      setChat((c) => [...c, { q: q.trim(), ...answer(q, h, library) }]);
      setQuestion("");
      return;
    }
    const version = ++requestVersion.current;
    setBusy(true);
    setAiError("");
    try {
      const result = (await requestAi(
        "answer",
        h,
        q,
        library,
        fileConsent,
      )) as {
        text: string;
        sources: Resource[];
        model: string;
      };
      if (version === requestVersion.current) {
        setChat((c) => [...c, { q: q.trim(), ...result }]);
        setQuestion("");
      }
    } catch (error) {
      if (version === requestVersion.current)
        setAiError(
          error instanceof Error ? error.message : "AI request failed.",
        );
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  function enterFiles() {
    const fallback: Handoff[] = [
      {
        id: "personal-handoff",
        name: "Your documents",
        role: "Document owner",
        department: "Your workspace",
        recipient: "You",
        type: "Document review",
        due: new Date().toISOString().slice(0, 10),
        responsibilities:
          "Summarize the selected files and identify responsibilities, dates, decisions, and next steps.",
        selected: [],
        generated: false,
        approved: false,
      },
    ];
    const records = load("handoff-files-v1", fallback);
    setWorkspaceKind("files");
    setItems(records);
    setActive(records[0]?.id || "");
    setTab("Knowledge");
    setUseGemini(true);
    setChat([]);
    nav(records.length ? "handoff" : "dashboard");
  }
  async function organizeFiles() {
    if (busy || filesLoading) return;
    const version = ++requestVersion.current;
    setBusy(true); setAiError("");
    try {
      const selected = uploads.filter(record=>h.selected.includes(record.id)).map(record=>record.resource);
      const result = await requestAi("organize", {...h,selected:selected.map(r=>r.id)}, undefined, selected, fileConsent) as SavedOrganization;
      if (version === requestVersion.current) setOrganization(result);
    } catch(error) { if(version === requestVersion.current) setAiError(error instanceof Error?error.message:"Organization failed."); }
    finally {if(version === requestVersion.current) setBusy(false);}
  }
  async function summarizeFiles() {
    if (busy || filesLoading) return;
    const version = ++requestVersion.current;
    setBusy(true);
    setAiError("");
    try {
      const result = (await requestAi(
        "summary",
        h,
        undefined,
        library,
        fileConsent,
      )) as { text: string; sources: Resource[]; model: string };
      if (version === requestVersion.current) update({ summary: result });
    } catch (error) {
      if (version === requestVersion.current)
        setAiError(
          error instanceof Error ? error.message : "Summary generation failed.",
        );
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  async function generateManual() {
    if (busy) return;
    if (!useGemini) {
      update({ generated: true, approved: false, aiManual: undefined });
      setTab("Training manual");
      return;
    }
    const version = ++requestVersion.current;
    setBusy(true);
    setAiError("");
    try {
      const aiManual = (await requestAi(
        "manual",
        h,
        undefined,
        library,
        fileConsent,
      )) as AiManual;
      if (version === requestVersion.current) {
        save(
          items.map((i) =>
            i.id === h.id
              ? { ...i, generated: true, approved: false, aiManual }
              : i,
          ),
        );
        setTab("Training manual");
      }
    } catch (error) {
      if (version === requestVersion.current)
        setAiError(
          error instanceof Error ? error.message : "AI request failed.",
        );
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  const aiControls = (
    <>
      <AiControls
        enabled={useGemini}
        busy={busy}
        onChange={(value) => {
          setUseGemini(value);
          setChat([]);
          setAiError("");
        }}
      />
      {h.selected.some((id) => id.startsWith("upload_")) && (
        <label className="file-consent">
          <input
            type="checkbox"
            checked={fileConsent}
            disabled={busy}
            onChange={(e) => setFileConsent(e.target.checked)}
          />{" "}
          I am authorized to send the selected files to Google for AI
          processing.
        </label>
      )}
      {aiError && (
        <p role="alert" className="notice">
          {aiError}
        </p>
      )}
      {busy && <p role="status">Waiting for Gemini…</p>}
    </>
  );
  const logo = (
    <span className="logo">
      <span className="logo-mark">
        <Layers size={23} />
      </span>
      handoff<span className="logo-dot">.</span>
    </span>
  );
  const sources = (docs: Resource[]) => (
    <div className="sources">
      {docs.map((d) => (
        <button
          key={d.id}
          className="source"
          onClick={() => setSource(library.find((r) => r.id === d.id) || d)}
        >
          <FileText size={13} />
          {d.title}
          <ArrowUpRight size={12} />
        </button>
      ))}
    </div>
  );
  return (
    <>
      {page === "home" || page === "signin" ? (
        <>
          <header className="public-header">
            <button className="plain" onClick={() => nav("home")}>
              {logo}
            </button>
            <nav>
              <a href="#how" onClick={() => nav("home")}>
                How it works
              </a>
              <a href="#built" onClick={() => nav("home")}>
                Why Handoff
              </a>
              <button className="btn small" onClick={() => nav("signin")}>
                Sign in <ArrowUpRight size={15} />
              </button>
            </nav>
          </header>
          {page === "home" ? (
            <main className="landing">
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="green-dot" /> A better way to move forward
                  </div>
                  <h1>
                    Great people move on.
                    <br />
                    <span>
                      Their knowledge
                      <br />
                      shouldn’t.
                    </span>
                  </h1>
                  <p>
                    Turn everything your team knows into everything your next
                    teammate needs. Make every transition a confident one.
                  </p>
                  <div className="hero-actions">
                    <button className="btn secondary" onClick={enterFiles}>
                      Use my own files <ArrowRight size={17} />
                    </button>
                    <button className="btn" onClick={() => nav("signin")}>
                      Explore the demo <ArrowRight size={17} />
                    </button>
                    <a className="text-link" href="#how">
                      See how it works <ChevronRight size={16} />
                    </a>
                  </div>
                  <div className="hero-foot">
                    <ShieldCheck size={15} /> Fictional data. No password. No
                    setup.
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="visual-top">
                    <span className="mini-logo">
                      <Layers size={16} /> handoff.
                    </span>
                    <span className="live-pill">Knowledge in motion</span>
                  </div>
                  <div className="visual-content">
                    <div className="eyebrow">EMPLOYEE TRANSITION</div>
                    <h3>
                      A new chapter.
                      <br />A clear path forward.
                    </h3>
                    <div className="people-transfer">
                      <div>
                        <span className="avatar large blue">AM</span>
                        <b>Alex Morgan</b>
                        <small>Cloud Consultant</small>
                      </div>
                      <div className="transfer-line">
                        <ArrowRight size={22} />
                      </div>
                      <div>
                        <span className="avatar large mint">SR</span>
                        <b>Sam Rivera</b>
                        <small>Incoming teammate</small>
                      </div>
                    </div>
                    <div className="visual-progress">
                      <span>Knowledge transfer</span>
                      <b>Ready for what’s next</b>
                    </div>
                    <div className="progress">
                      <i style={{ width: "78%" }} />
                    </div>
                    <div className="visual-doc">
                      <span className="doc-icon">
                        <BookOpen size={21} />
                      </span>
                      <div>
                        <b>Your next chapter, documented.</b>
                        <small>
                          A training manual built from team knowledge
                        </small>
                      </div>
                      <CheckCircle2 size={19} />
                    </div>
                  </div>
                  <div className="floating-note">
                    <span className="spark">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <b>Less searching. More knowing.</b>
                      <small>Answers with sources you can trust.</small>
                    </div>
                  </div>
                </div>
              </section>
              <section className="trust-line">
                BUILT FOR THE MOMENTS BETWEEN{" "}
                <span>One teammate’s experience.</span>
                <ArrowRight size={18} />
                <span>Your whole team’s next step.</span>
              </section>
              <section id="how" className="how">
                <div>
                  <div className="eyebrow">
                    CONTINUITY, WITHOUT THE COMPLEXITY
                  </div>
                  <h2>
                    From “ask Alex” to
                    <br />
                    “it’s all right here.”
                  </h2>
                </div>
                <div className="steps">
                  {[
                    [
                      "01",
                      "Gather what matters",
                      "Bring responsibilities, project context, and essential documents together.",
                    ],
                    [
                      "02",
                      "Make knowledge usable",
                      "Create a structured training manual, ready for a human review.",
                    ],
                    [
                      "03",
                      "Keep your team moving",
                      "Give incoming teammates a place to find answers and their footing.",
                    ],
                  ].map(([n, t, d]) => (
                    <article key={n}>
                      <span>{n}</span>
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section id="built" className="bottom-banner">
                <div>
                  <h2>
                    People change roles.
                    <br />
                    Progress doesn’t have to stop.
                  </h2>
                  <p>Knowledge stays. Teams move forward.</p>
                </div>
                <button className="btn light" onClick={() => nav("signin")}>
                  Meet your new handoff process <ArrowUpRight size={18} />
                </button>
              </section>
              <footer>
                {logo}
                <span>A working prototype. A more connected way forward.</span>
                <span>© {new Date().getFullYear()} Handoff</span>
              </footer>
            </main>
          ) : (
            <main className="signin">
              <div className="signin-story">
                <div className="eyebrow">YOUR TEAM’S NEXT CHAPTER</div>
                <h1>
                  Good transitions
                  <br />
                  start with
                  <br />
                  <span>shared knowledge.</span>
                </h1>
                <p>
                  Step into BridgePoint’s sample workspace and see knowledge
                  continuity in action.
                </p>
              </div>
              <section className="signin-card">
                <span className="icon-box">
                  <Layers />
                </span>
                <h2>Welcome to Handoff</h2>
                <p>Explore a company workspace.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setWorkspaceKind("demo");
                    setItems(load());
                    setActive("h1");
                    setUseGemini(false);
                    setChat([]);
                    nav("dashboard");
                  }}
                >
                  <label htmlFor="company">Demonstration company</label>
                  <select id="company">
                    <option>BridgePoint · IT consulting</option>
                  </select>
                  <div className="demo-note">
                    <ShieldCheck size={20} />
                    <div>
                      <b>A safe space to explore</b>
                      <p>
                        This is demonstration authentication. All company,
                        employee, and project information is fictional. Use
                        sample information only.
                      </p>
                    </div>
                  </div>
                  <button className="btn full">
                    Enter demo workspace <ArrowRight size={17} />
                  </button>
                </form>
                <div className="personal-entry">
                  <h3>Ready to use your own files?</h3>
                  <p>
                    Import and summarize documents in a browser-local workspace.
                    No company sign-in or shared storage is provided.
                  </p>
                  <button className="btn full secondary" onClick={enterFiles}>
                    Use my own files <ArrowRight size={17} />
                  </button>
                </div>
                <button className="text-link back" onClick={() => nav("home")}>
                  <ArrowLeft size={14} /> Back to website
                </button>
              </section>
            </main>
          )}
        </>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <button className="plain" onClick={() => nav("dashboard")}>
              {logo}
            </button>
            <div className="company">
              <span className="company-icon">
                {workspaceKind === "demo" ? "B" : "F"}
              </span>
              <div>
                <b>{workspaceKind === "demo" ? "BridgePoint" : "Your files"}</b>
                <small>
                  {workspaceKind === "demo"
                    ? "Demo workspace"
                    : "Browser workspace"}
                </small>
              </div>
              <span className="company-chevron">⌄</span>
            </div>
            <div className="nav-label">WORKSPACE</div>
            <nav>
              {[
                [LayoutDashboard, "Dashboard", "dashboard"],
                [BookOpen, "Handoffs", "handoff"],
                [MessageSquare, "Ask Handoff", "ask"],
              ].map(([Icon, label, p]) => {
                const I = Icon as typeof Layers;
                return (
                  <button
                    key={String(p)}
                    className={page === p ? "active" : ""}
                    onClick={() => nav(p as Page)}
                  >
                    <I size={18} />
                    {String(label)}
                    {p === "handoff" && (
                      <span className="nav-count">{items.length}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="sidebar-bottom">
              <div className="sample-label">
                <span className="green-dot" />{" "}
                {workspaceKind === "demo"
                  ? "Fictional demonstration"
                  : "Browser-local files"}
              </div>
              <p>Real continuity starts with a thoughtful handoff.</p>
              <button
                onClick={() => {
                  nav("home");
                  setChat([]);
                }}
              >
                <LogOut size={16} /> Leave workspace
              </button>
              <div className="profile">
                <span className="avatar mint">
                  {workspaceKind === "demo" ? "JD" : "YOU"}
                </span>
                <div>
                  <b>
                    {workspaceKind === "demo" ? "Jamie Davis" : "Local user"}
                  </b>
                  <small>
                    {workspaceKind === "demo"
                      ? "Demo administrator"
                      : "This browser"}
                  </small>
                </div>
              </div>
            </div>
          </aside>
          <div className="workspace">
            <header className="workspace-header">
              <span>
                Workspace <ChevronRight size={14} />{" "}
                <b>
                  {page === "dashboard"
                    ? "Overview"
                    : page === "ask"
                      ? "Ask Handoff"
                      : "Employee handoff"}
                </b>
              </span>
              <div className="header-actions">
                <span className="demo-badge">
                  {workspaceKind === "demo" ? "DEMO MODE" : "FILES MODE"}
                </span>
                <button
                  className="mobile-exit icon-button"
                  aria-label="Leave workspace"
                  onClick={() => {
                    nav("home");
                    setChat([]);
                  }}
                >
                  <LogOut size={17} />
                </button>
              </div>
            </header>
            <main className="workspace-main">
              {notice && (
                <div role="alert" className="notice">
                  {notice}
                </div>
              )}
              {page === "dashboard" ? (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">
                        {workspaceKind === "demo"
                          ? "BRIDGEPOINT WORKSPACE"
                          : "YOUR FILE WORKSPACE"}
                      </div>
                      <h1>
                        A little change.
                        <br className="mobile-only" /> A lot of possibility.
                      </h1>
                      <p>
                        Keep your team’s knowledge moving in the right
                        direction.
                      </p>
                    </div>
                    <button className="btn" onClick={() => setCreate(true)}>
                      <Plus size={17} /> New handoff
                    </button>
                  </div>
                  <div className="stats">
                    {[
                      [
                        Users,
                        "Active handoffs",
                        items.filter((i) => !i.approved).length,
                        "Transitions in motion",
                      ],
                      [
                        Clock,
                        "Pending review",
                        items.filter((i) => i.generated && !i.approved).length,
                        "Ready for a second set of eyes",
                      ],
                      [
                        CheckCircle2,
                        "Completed transfers",
                        items.filter((i) => i.approved).length,
                        "Knowledge ready to carry forward",
                      ],
                    ].map(([Icon, t, n, d]) => {
                      const I = Icon as typeof Layers;
                      return (
                        <article key={String(t)}>
                          <div>
                            <span>{String(t)}</span>
                            <I size={18} />
                          </div>
                          <strong>{String(n)}</strong>
                          <small>{String(d)}</small>
                        </article>
                      );
                    })}
                  </div>
                  <section className="handoff-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Your team’s handoffs</h2>
                        <p>Every transition, with a clear next step.</p>
                      </div>
                      <span className="subtle">{items.length} total</span>
                    </div>
                    <div className="table-tools">
                      <div className="filter-tabs">
                        {[
                          "All handoffs",
                          "In progress",
                          "Pending review",
                          "Completed",
                        ].map((f) => (
                          <button
                            key={f}
                            className={filter === f ? "selected" : ""}
                            onClick={() => setFilter(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <label className="search">
                        <Search size={16} />
                        <input
                          aria-label="Search handoffs"
                          placeholder="Search people or roles"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>EMPLOYEE / ROLE</th>
                            <th>RECEIVING TEAMMATE</th>
                            <th>TRANSITION DATE</th>
                            <th>STATUS</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {items
                            .filter(
                              (i) =>
                                (filter === "All handoffs" ||
                                  status(i) === filter) &&
                                (i.name + " " + i.role)
                                  .toLowerCase()
                                  .includes(search.toLowerCase()),
                            )
                            .map((i) => (
                              <tr key={i.id}>
                                <td>
                                  <div className="handoff-open-controls">
                                    <button
                                      className="person-button"
                                      onClick={() => open(i.id)}
                                    >
                                      <span className="avatar blue">
                                        {i.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join("")}
                                      </span>
                                      <span>
                                        <b>{i.name}</b>
                                        <small>{i.role}</small>
                                      </span>
                                    </button>
                                    <button
                                      className="icon-button"
                                      aria-label={"Open " + i.name + " handoff"}
                                      onClick={() => open(i.id)}
                                    >
                                      <ArrowUpRight size={18} />
                                    </button>
                                  </div>
                                </td>
                                <td>{i.recipient}</td>
                                <td>{i.due}</td>
                                <td>
                                  <span
                                    className={
                                      "status " +
                                      (i.approved
                                        ? "complete"
                                        : i.generated
                                          ? "review"
                                          : "ongoing")
                                    }
                                  >
                                    <span />
                                    {status(i)}
                                  </span>
                                </td>
                                <td>
                                  <button className="text-link danger" disabled={deleting||importing} aria-label={"Delete " + i.name + " handoff"} onClick={()=>removeHandoff(i)}>Delete</button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {!items.some(
                        (i) =>
                          (filter === "All handoffs" || status(i) === filter) &&
                          (i.name + " " + i.role)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                      ) && (
                        <p className="empty">
                          No handoffs match. Try another search or filter.
                        </p>
                      )}
                    </div>
                  </section>
                  <div className="dashboard-bottom">
                    <section className="tip-card">
                      <span className="icon-box">
                        <Sparkles size={22} />
                      </span>
                      <div>
                        <div className="eyebrow">
                          MORE THAN A FOLDER OF FILES
                        </div>
                        <h2>Turn experience into a head start.</h2>
                        <p>
                          Gather the context behind the work, then create a
                          manual your next teammate can actually use.
                        </p>
                        <button
                          className="text-link"
                          onClick={() => open(items[0].id)}
                        >
                          {workspaceKind === "demo"
                            ? "Explore a sample handoff"
                            : "Open your files"}{" "}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </section>
                    <section className="activity">
                      <h2>Workspace activity</h2>
                      <div>
                        <span className="activity-dot" />
                        <p>
                          <b>
                            {items.filter((i) => i.approved).length} approved
                            transfers
                          </b>
                          <small>Knowledge reviewed and ready</small>
                        </p>
                      </div>
                      <div>
                        <span className="activity-dot teal" />
                        <p>
                          <b>
                            {items.filter((i) => i.generated).length} manuals
                            generated
                          </b>
                          <small>Structured from selected sample sources</small>
                        </p>
                      </div>
                      <div>
                        <span className="activity-dot gray" />
                        <p>
                          <b>{items.length} employee handoffs</b>
                          <small>Fictional BridgePoint records</small>
                        </p>
                      </div>
                    </section>
                  </div>
                </>
              ) : !items.length ? (
                <section className="card"><h1>No handoffs yet</h1><p>Create a handoff to add files and get started.</p><button className="btn" onClick={()=>setCreate(true)}>Create a handoff</button></section>
              ) : page === "handoff" ? (
                <>
                  <button
                    className="text-link"
                    onClick={() => nav("dashboard")}
                  >
                    <ArrowLeft size={15} /> All handoffs
                  </button>
                  <button className="text-link danger" disabled={deleting||importing} onClick={()=>removeHandoff(h)}>Delete handoff</button>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">EMPLOYEE HANDOFF</div>
                      <h1>
                        {h.name}{" "}
                        <ArrowRight className="title-arrow" size={24} />{" "}
                        {h.recipient}
                      </h1>
                      <p>
                        {h.role} · {h.department} · {h.type}
                      </p>
                    </div>
                    <span
                      className={
                        "status " +
                        (h.approved
                          ? "complete"
                          : h.generated
                            ? "review"
                            : "ongoing")
                      }
                    >
                      {status(h)}
                    </span>
                  </div>
                  <div
                    className="detail-tabs"
                    role="tablist"
                    aria-label="Handoff sections"
                  >
                    {["Overview", "Knowledge", "Training manual"].map((t) => (
                      <button
                        role="tab"
                        aria-selected={tab === t}
                        key={t}
                        onClick={() => setTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {tab === "Overview" ? (
                    <div className="detail-grid">
                      <section className="card">
                        <div className="eyebrow">THE WORK AHEAD</div>
                        <h2>Set the next teammate up for success.</h2>
                        <p className="body-copy">{h.responsibilities}</p>
                        <dl>
                          <dt>Receiving teammate</dt>
                          <dd>{h.recipient}</dd>
                          <dt>Transition date</dt>
                          <dd>{h.due}</dd>
                          <dt>Transition type</dt>
                          <dd>{h.type}</dd>
                        </dl>
                        <button
                          className="btn"
                          onClick={() => setTab("Knowledge")}
                        >
                          Organize knowledge <ArrowRight size={16} />
                        </button>
                      </section>
                      <section className="card">
                        <h2>Your handoff checklist</h2>
                        {[
                          ["Define responsibilities", true],
                          ["Select knowledge sources", h.selected.length > 0],
                          ["Generate training manual", h.generated],
                          ["Review and approve", h.approved],
                        ].map(([t, done]) => (
                          <div className="check-row" key={String(t)}>
                            <span className={done ? "check done" : "check"}>
                              {done ? <Check size={14} /> : null}
                            </span>
                            {String(t)}
                          </div>
                        ))}
                        <div className="demo-note">
                          {workspaceKind === "demo"
                            ? "BridgePoint records are fictional. Use your file workspace for your own authorized documents."
                            : "Use only documents you are authorized to process. Google processes selected contents when you request AI; review your API data terms."}
                        </div>
                      </section>
                    </div>
                  ) : tab === "Knowledge" ? (
                    <section className="card">
                      <div className="panel-heading">
                        <div>
                          <h2>A home for the important details</h2>
                          <p>
                            Import files or select resources below, then review
                            the source content before generating.
                          </p>
                        </div>
                        <span className="status ongoing">
                          {h.selected.length} selected
                        </span>
                      </div>
                      <div className="demo-note">
                        {workspaceKind === "demo"
                          ? "Sample library · BridgePoint resources are fictional. You may also import your own authorized files below."
                          : "Your file workspace · No sample company documents are included. File contents stay in this browser until you explicitly send selected content to Gemini."}
                      </div>
                      {filesError && (
                        <p role="alert" className="notice">
                          {filesError}
                        </p>
                      )}
                      <UploadPanel
                        key={h.id}
                        handoffId={h.id}
                        records={uploads}
                        loading={filesLoading}
                        onBusyChange={setImporting}
                        onChange={(record) => {
                          if (activeHandoffRef.current === record.handoffId)
                            setUploads((current) => [...current, record]);
                        }}
                        onRemove={(id) => {
                          if (
                            activeHandoffRef.current === h.id &&
                            workspaceRef.current === workspaceKind
                          ) {
                            setUploads((current) =>
                              current.filter((record) => record.id !== id),
                            );
                            requestVersion.current++;
                            setBusy(false);
                            setChat([]);
                          }
                          update((current) => ({
                            selected: current.selected.filter(
                              (selected) => selected !== id,
                            ),
                            generated: false,
                            approved: false,
                            aiManual: undefined,
                            summary: undefined,
                          }));
                        }}
                      />
                      {aiControls}
                      <div className="organization-actions">
                        <button className="btn secondary" disabled={filesLoading || !uploads.length} onClick={()=>update({selected:[...new Set([...h.selected,...uploads.map(r=>r.id)])],generated:false,approved:false,aiManual:undefined,summary:undefined})}>Select all files</button>
                        <button className="btn secondary" disabled={filesLoading || !h.selected.some(id=>id.startsWith("upload_"))} onClick={()=>update({selected:h.selected.filter(id=>!id.startsWith("upload_")),generated:false,approved:false,aiManual:undefined,summary:undefined})}>Clear file selection</button>
                      </div>
                      <div className="resource-list">
                        {library.map((r) => (
                          <div className="resource-row" key={r.id}>
                            <input
                              type="checkbox"
                              aria-label={"Include " + r.title}
                              checked={h.selected.includes(r.id)}
                              onChange={(e) =>
                                update({
                                  selected: e.target.checked
                                    ? [...h.selected, r.id]
                                    : h.selected.filter((id) => id !== r.id),
                                  generated: false,
                                  approved: false,
                                  aiManual: undefined,
                                  summary: undefined,
                                })
                              }
                            />
                            <span className="doc-icon">
                              <FileText size={22} />
                            </span>
                            <div>
                              <b>{r.title}</b>
                              <small>
                                {r.category} ·{" "}
                                {r.origin === "upload"
                                  ? "Your file"
                                  : "Sample document"}
                              </small>
                            </div>
                            <button
                              className="text-link"
                              onClick={() => setSource(r)}
                            >
                              Read source <ArrowUpRight size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="subtle">
                        Changing selected sources resets the manual and approval
                        so the next version can be reviewed.
                      </p>
                      <OrganizationPanel key={"organization-"+h.id} records={uploads.filter(record=>h.selected.includes(record.id))} plan={organization} busy={busy||filesLoading} aiEnabled={useGemini&&fileConsent} onChange={setOrganization} onAi={organizeFiles}/>
                      <div className="summary-panel">
                        <h3>Get the useful details, faster</h3>
                        <p>
                          Generate a source-referenced summary of only the
                          selected files. Summaries, manuals and questions support up to 8 uploaded files (12 total sources); folder plans support 20. Up to 120,000 extracted characters and
                          3 MB of image/scanned PDF attachments per request.
                        </p>
                        <button
                          className="btn"
                          disabled={
                            !useGemini ||
                            !h.selected.length ||
                            busy ||
                            filesLoading
                          }
                          onClick={summarizeFiles}
                        >
                          Generate document summary
                        </button>
                        {h.summary && (
                          <article className="document-summary">
                            <h3>Document summary</h3>
                            <small>
                              Generated by Gemini ({h.summary.model})
                            </small>
                            <p style={{ whiteSpace: "pre-line" }}>
                              {h.summary.text}
                            </p>
                            {sources(h.summary.sources)}
                            <button
                              className="text-link"
                              onClick={() => {
                                const url = URL.createObjectURL(
                                  new Blob(
                                    [
                                      h.summary!.text +
                                        "\n\nSources: " +
                                        h
                                          .summary!.sources.map(
                                            (source) => source.title,
                                          )
                                          .join(", "),
                                    ],
                                    { type: "text/plain;charset=utf-8" },
                                  ),
                                );
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = "handoff-summary.txt";
                                link.click();
                                setTimeout(
                                  () => URL.revokeObjectURL(url),
                                  1000,
                                );
                              }}
                            >
                              Download summary
                            </button>
                          </article>
                        )}
                      </div>
                      <button
                        className="btn"
                        disabled={!h.selected.length || busy || filesLoading}
                        onClick={generateManual}
                      >
                        <Sparkles size={17} />{" "}
                        {useGemini
                          ? "Generate with Gemini"
                          : "Generate sample manual"}
                      </button>
                    </section>
                  ) : (
                    <section className="card manual">
                      {!h.generated ? (
                        <div className="empty">
                          <BookOpen size={40} />
                          <h2>Your next chapter starts here.</h2>
                          <p>
                            Select knowledge sources, then generate a structured
                            sample training manual.
                          </p>
                          <button
                            className="btn"
                            onClick={() => setTab("Knowledge")}
                          >
                            Choose knowledge sources <ArrowRight size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="panel-heading">
                            <div>
                              <div className="eyebrow">TRAINING MANUAL</div>
                              <h2>A practical guide for {h.recipient}</h2>
                              <p>
                                From {h.name} · Target transition: {h.due}
                              </p>
                            </div>
                            <button
                              className="btn small"
                              onClick={() => window.print()}
                            >
                              Print / Save PDF
                            </button>
                          </div>
                          <div className="demo-note">
                            <Sparkles size={18} />{" "}
                            {h.aiManual
                              ? `Generated by Gemini (${h.aiManual.model}) from your selected sources. AI may be wrong; verify every section and citation before approval.`
                              : "Simulated AI: this draft assembles your handoff details and selected sample sources using local templates. Review all content before approving."}
                          </div>
                          {(h.aiManual?.sections || manual(h, library)).map(
                            (s) => (
                              <article className="manual-section" key={s.title}>
                                <h3>{s.title}</h3>
                                <p>{s.body}</p>
                                {s.sources.length ? (
                                  sources(s.sources)
                                ) : (
                                  <small className="subtle">
                                    Source: handoff details entered in this
                                    demo.
                                  </small>
                                )}
                              </article>
                            ),
                          )}
                          <div className="approval">
                            <div>
                              <h3>
                                {h.approved
                                  ? workspaceKind === "demo"
                                    ? "Approved by Jamie Davis · Demo administrator"
                                    : "Approved in this browser · Not an authenticated company review"
                                  : "Ready for a human review"}
                              </h3>
                              <p>
                                {h.approved
                                  ? "This handoff is complete. Changing sources will reopen review."
                                  : "Confirm the responsibilities, source material, and steps with the receiving teammate."}
                              </p>
                            </div>
                            <button
                              className="btn"
                              disabled={h.approved}
                              onClick={() => update({ approved: true })}
                            >
                              <Check size={17} />
                              {h.approved ? "Approved" : "Approve manual"}
                            </button>
                          </div>
                        </>
                      )}
                    </section>
                  )}
                </>
              ) : (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">ASK HANDOFF</div>
                      <h1>A little context goes a long way.</h1>
                      <p>
                        Find answers in the knowledge your teammate left behind.
                      </p>
                    </div>
                  </div>
                  <section className="card ask-card">
                    <label htmlFor="ask-handoff">Knowledge from</label>
                    <select
                      id="ask-handoff"
                      value={h.id}
                      onChange={(e) => {
                        setActive(e.target.value);
                        setChat([]);
                      }}
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} → {i.recipient}
                        </option>
                      ))}
                    </select>
                    <div className="demo-note">
                      <Sparkles size={18} />{" "}
                      {useGemini
                        ? "Gemini mode · Answers use only your selected sources and handoff details. Files are local to this browser; shared company permissions are not implemented."
                        : "Simulated AI · Answers retrieve matching selected sample documents, with sources. No external AI service is used."}
                    </div>
                    {aiControls}
                    {!chat.length && (
                      <div className="ask-welcome">
                        <span className="icon-box">
                          <MessageSquare size={26} />
                        </span>
                        <h2>What would you like to know?</h2>
                        <p>Start with a question about the selected handoff.</p>
                        <div className="suggestions">
                          {[
                            "What are the migration steps?",
                            "When are client updates?",
                            "Why was phased migration chosen?",
                          ].map((q) => (
                            <button
                              key={q}
                              disabled={
                                busy || (useGemini && !h.selected.length)
                              }
                              onClick={() => ask(q)}
                            >
                              {q}
                              <ArrowUpRight size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div aria-live="polite">
                      {chat.map((c, i) => (
                        <div className="exchange" key={i}>
                          <p className="question">{c.q}</p>
                          <div className="answer">
                            <span className="mini-logo">
                              <Sparkles size={16} />{" "}
                              {c.model
                                ? `Gemini · ${c.model}`
                                : "Handoff · Sample answer"}
                            </span>
                            <p>{c.text}</p>
                            {sources(c.sources)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      className="ask-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        ask(question);
                      }}
                    >
                      <input
                        aria-label="Your question"
                        placeholder="Ask about responsibilities, processes, or project context…"
                        value={question}
                        maxLength={500}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                      <button
                        className="btn"
                        disabled={
                          !question.trim() ||
                          busy ||
                          (useGemini && !h.selected.length)
                        }
                        aria-label="Send question"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </form>
                    <p className="subtle">
                      Only selected sources are searched. Always verify guidance
                      with the linked documents.
                    </p>
                  </section>
                </>
              )}
              <div className="workspace-footer">
                <span>Knowledge stays. Teams move forward.</span>
                <span>
                  {workspaceKind === "demo"
                    ? "Handoff demo · Fictional records"
                    : "Handoff · Browser-local file workspace"}
                </span>
              </div>
            </main>
          </div>
        </div>
      )}
      {source && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-title"
          >
            <button
              className="close icon-button"
              aria-label="Close source"
              onClick={() => setSource(null)}
            >
              <X />
            </button>
            <div className="eyebrow">SAMPLE SOURCE · {source.category}</div>
            <h2 id="source-title">{source.title}</h2>
            <p
              className="body-copy"
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: "45vh",
                overflow: "auto",
              }}
            >
              {source.text ||
                "The original source is not available in this browser. Reattach the file to review it."}
            </p>
            {source.origin === "upload" &&
              uploads.some((record) => record.id === source.id) && (
                <button
                  className="btn secondary"
                  onClick={() =>
                    downloadOriginal(
                      uploads.find((record) => record.id === source.id)!,
                    )
                  }
                >
                  Download original file
                </button>
              )}
            <div className="demo-note">
              {source.origin === "upload"
                ? "This content was imported from your file and saved in this browser."
                : "Fictional document supplied with this prototype. No external system is connected."}
            </div>
            <button className="btn" onClick={() => setSource(null)}>
              Done reading <Check size={16} />
            </button>
          </section>
        </div>
      )}
      {create && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
          >
            <button
              className="close icon-button"
              aria-label="Close new handoff"
              onClick={() => setCreate(false)}
            >
              <X />
            </button>
            <div className="eyebrow">MAKE THE NEXT STEP A GOOD ONE</div>
            <h2 id="create-title">Create a handoff</h2>
            <p>
              {workspaceKind === "demo"
                ? "Use fictional details only."
                : "Use only information you are authorized to process."}{" "}
              You can organize knowledge next.
            </p>
            {notice && (
              <p role="alert" className="notice">
                {notice}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const get = (k: string) => String(f.get(k) || "").trim();
                if (
                  [
                    "name",
                    "role",
                    "department",
                    "recipient",
                    "responsibilities",
                  ].some((k) => !get(k))
                ) {
                  setNotice("Please fill every field with sample details.");
                  return;
                }
                const item: Handoff = {
                  id: crypto.randomUUID(),
                  name: get("name"),
                  role: get("role"),
                  department: get("department"),
                  type: get("type"),
                  recipient: get("recipient"),
                  responsibilities: get("responsibilities"),
                  due: get("due"),
                  selected: [],
                  generated: false,
                  approved: false,
                };
                save([item, ...items]);
                setCreate(false);
                open(item.id);
              }}
            >
              <div className="form-grid">
                {[
                  ["name", "Departing / transferring employee"],
                  ["role", "Position"],
                  ["department", "Department"],
                  ["recipient", "Receiving teammate"],
                ].map(([n, l]) => (
                  <label key={n}>
                    {l}
                    <input
                      name={n}
                      required
                      maxLength={100}
                      placeholder={
                        n === "name"
                          ? "e.g. Avery Lane"
                          : "Sample " + l.toLowerCase()
                      }
                    />
                  </label>
                ))}
                <label>
                  Transition type
                  <select name="type">
                    <option>Departure</option>
                    <option>Internal transfer</option>
                    <option>Project transfer</option>
                    <option>Retirement</option>
                  </select>
                </label>
                <label>
                  Transition date
                  <input name="due" type="date" required />
                </label>
              </div>
              <label>
                Current responsibilities
                <textarea
                  name="responsibilities"
                  required
                  maxLength={2000}
                  rows={3}
                  placeholder="What should the incoming teammate take over?"
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setCreate(false)}
                >
                  Cancel
                </button>
                <button className="btn">
                  Create handoff <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
