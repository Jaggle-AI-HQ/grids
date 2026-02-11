import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import {
  getSpreadsheet,
  updateSpreadsheet,
  type Spreadsheet,
} from "../lib/api";
import { init, Model, IronCalc } from "@ironcalc/workbook";
import "@ironcalc/workbook/dist/ironcalc.css";
import { useSaveManager } from "../lib/save-manager";
import {
  ArrowLeft,
  Save,
  Check,
  Loader2,
  Grid3X3,
  AlertCircle,
  Circle,
  RotateCcw,
} from "lucide-react";
import MenuBar from "../components/MenuBar";
import FormatToolbar from "../components/FormatToolbar";
import styles from "./WorkbookPage.module.css";

/** Memoised wrapper so IronCalc only re-renders when model/refreshId change,
 *  not on every parent state update (e.g. typing in the title input). */
const MemoizedIronCalc = memo(IronCalc);

export default function WorkbookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const spreadsheetId = id ? parseInt(id) : null;

  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [refreshId, setRefreshId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [error, setError] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<Model | null>(null);
  const workbookContainerRef = useRef<HTMLDivElement>(null);

  // ── Save manager ───────────────────────────
  const {
    status: saveStatus,
    errorMessage: saveError,
    saveNow,
    markDirty,
    setInitialSnapshot,
    failureCount,
  } = useSaveManager(spreadsheetId, modelRef);

  // ── Block in-app navigation when unsaved ───
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      (saveStatus === "unsaved" || saveStatus === "saving"),
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const leave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      );
      if (leave) {
        // Fire-and-forget save attempt before navigating away
        saveNow();
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, saveNow]);

  // ── Load spreadsheet + init IronCalc WASM ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      try {
        await init();

        const sheet = await getSpreadsheet(parseInt(id));
        if (cancelled) return;

        setSpreadsheet(sheet);
        setTitle(sheet.title);

        let m: Model;
        if (sheet.data) {
          try {
            const bytes = Uint8Array.from(atob(sheet.data), (c) =>
              c.charCodeAt(0),
            );
            m = Model.from_bytes(bytes);
          } catch {
            m = new Model(sheet.title, "en", "UTC");
          }
        } else {
          m = new Model(sheet.title, "en", "UTC");
        }

        modelRef.current = m;
        setModel(m);
        setInitialSnapshot();
        setRefreshId((prev) => prev + 1);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load spreadsheet",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, setInitialSnapshot]);

  // ── Detect model mutations via DOM observation ─
  //
  // IronCalc renders into the DOM and doesn't expose an onChange
  // callback. We observe the workbook container for DOM mutations
  // and relevant user-input events as reliable heuristics that the
  // model has been mutated.
  // ────────────────────────────────────────────────
  useEffect(() => {
    const container = workbookContainerRef.current;
    if (!container || !model) return;

    // MutationObserver catches cell renders, style changes, sheet tab updates
    const observer = new MutationObserver(() => {
      markDirty();
    });
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "value"],
    });

    // Keyboard events inside the workbook (typing in cells, formulas, shortcuts)
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore pure navigation keys that don't mutate data
      const navOnly = [
        "Tab",
        "Escape",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];
      if (navOnly.includes(e.key) && !e.ctrlKey && !e.metaKey) return;
      markDirty();
    }

    // Pointer-up catches drag fills, column resizes, toolbar button clicks
    function handlePointerUp() {
      markDirty();
    }

    container.addEventListener("keydown", handleKeyDown, true);
    container.addEventListener("pointerup", handlePointerUp, true);

    return () => {
      observer.disconnect();
      container.removeEventListener("keydown", handleKeyDown, true);
      container.removeEventListener("pointerup", handlePointerUp, true);
    };
  }, [model, markDirty]);

  // ── Ctrl+S / Cmd+S keyboard shortcut ───────
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [saveNow]);

  // ── Save before navigating back ────────────
  const handleBack = useCallback(async () => {
    if (saveStatus === "unsaved" || saveStatus === "error") {
      await saveNow();
    }
    navigate("/");
  }, [saveStatus, saveNow, navigate]);

  // ── Title editing ──────────────────────────
  const titleAreaRef = useRef<HTMLDivElement>(null);

  async function commitTitle() {
    setEditingTitle(false);
    if (!spreadsheetId || !title.trim() || title === spreadsheet?.title) {
      setTitle(spreadsheet?.title || "Untitled spreadsheet");
      return;
    }
    try {
      const updated = await updateSpreadsheet(spreadsheetId, {
        title: title.trim(),
      });
      setSpreadsheet(updated);
      setTitle(updated.title);
    } catch {
      setTitle(spreadsheet?.title || "Untitled spreadsheet");
    }
  }

  // Close title editing on click outside the title area
  useEffect(() => {
    if (!editingTitle) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        titleAreaRef.current &&
        !titleAreaRef.current.contains(e.target as Node)
      ) {
        commitTitle();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  });

  // ── Refresh after toolbar action ───────────
  const handleToolbarRefresh = useCallback(() => {
    setRefreshId((prev) => prev + 1);
    markDirty();
  }, [markDirty]);

  // ── Render: loading state ──────────────────
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinnerIcon} />
        <p>Loading spreadsheet...</p>
      </div>
    );
  }

  // ── Render: error state ────────────────────
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          Back to dashboard
        </button>
      </div>
    );
  }

  // ── Render: workbook ───────────────────────
  return (
    <div className={styles.layout}>
      {/* Toolbar */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={handleBack}
            className={styles.navButton}
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className={styles.logoMark}>
            <Grid3X3 size={16} strokeWidth={2.5} />
          </div>
          <div className={styles.titleArea} ref={titleAreaRef}>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                title="Spreadsheet title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setTitle(spreadsheet?.title || "");
                    setEditingTitle(false);
                  }
                }}
                className={styles.titleInput}
                autoFocus
              />
            ) : (
              <button
                className={styles.titleButton}
                onClick={() => {
                  setEditingTitle(true);
                  setTimeout(() => {
                    titleInputRef.current?.focus();
                    titleInputRef.current?.select();
                  }, 0);
                }}
              >
                {title}
              </button>
            )}
          </div>
        </div>

        <div className={styles.toolbarRight}>
          {/* Save status indicator */}
          <div className={styles.saveStatus} role="status" aria-live="polite">
            {saveStatus === "unsaved" && (
              <>
                <Circle
                  size={8}
                  className={styles.unsavedDot}
                  fill="currentColor"
                />
                <span>Unsaved changes</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <Loader2 size={14} className={styles.spinnerIcon} />
                <span>
                  Saving{failureCount > 0 ? ` (retry ${failureCount})` : ""}...
                </span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check size={14} className={styles.savedIcon} />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <button
                className={styles.errorBadge}
                onClick={() => saveNow()}
                title={saveError || "Save failed"}
              >
                <AlertCircle size={14} />
                <span>Save failed</span>
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Manual save button */}
          <button
            onClick={() => saveNow()}
            className={styles.saveButton}
            disabled={
              saveStatus === "saving" ||
              saveStatus === "idle" ||
              saveStatus === "saved"
            }
            title="Save (Ctrl+S)"
          >
            <Save size={15} />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Menu bar (File, Edit, View, Insert, Format, Data) */}
      {model && (
        <MenuBar
          model={model}
          title={title}
          onSave={saveNow}
          onRefresh={handleToolbarRefresh}
        />
      )}

      {/* Format toolbar (bold, italic, fonts, colors, alignment, etc.) */}
      {model && (
        <FormatToolbar model={model} onRefresh={handleToolbarRefresh} />
      )}

      {/* Spreadsheet */}
      <div
        className={styles.workbookContainer}
        ref={workbookContainerRef}
        inert={editingTitle || undefined}
      >
        {model && <MemoizedIronCalc model={model} refreshId={refreshId} />}
      </div>
    </div>
  );
}
