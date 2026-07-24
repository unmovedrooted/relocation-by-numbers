"use client";

import { useEffect, useState } from "react";
import {
  getSavedScenarios, saveScenario, deleteScenario, renameScenario,
  type SavedScenario,
} from "../lib/savedScenarios";

type NewScenario = Omit<SavedScenario, "id" | "createdAt">;

export default function SavedScenariosPanel({
  getCurrentScenario,
}: {
  // Called fresh at save-time so the panel always captures live parent state,
  // not a stale snapshot from when the panel first rendered.
  getCurrentScenario: () => NewScenario;
}) {
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    setSavedScenarios(getSavedScenarios());
  }, []);

  const handleSave = () => {
    saveScenario(getCurrentScenario());
    setSavedScenarios(getSavedScenarios());
    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleLoad = (scenario: SavedScenario) => {
    window.location.href = scenario.url;
  };

  const handleDelete = (id: string) => {
    deleteScenario(id);
    setSavedScenarios(getSavedScenarios());
  };

  const startRename = (scenario: SavedScenario) => {
    setRenamingId(scenario.id);
    setRenameDraft(scenario.label);
  };

  const commitRename = (id: string) => {
    const label = renameDraft.trim();
    if (label) {
      renameScenario(id, label);
      setSavedScenarios(getSavedScenarios());
    }
    setRenamingId(null);
    setRenameDraft("");
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-sky-900/60 dark:bg-sky-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-400">Save this scenario</div>
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Bookmark your current inputs on this device so you can come back to them or compare with other saved scenarios.
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-950"
        >
          {saveStatus === "saved" ? "Saved!" : "Save scenario"}
        </button>
      </div>

      {savedScenarios.length > 0 && (
        <div className="mt-4 border-t border-sky-200 pt-4 dark:border-sky-900/60">
          <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Saved Scenarios, {savedScenarios.length}/20
          </div>
          <div className="space-y-2">
            {savedScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                {renamingId === scenario.id ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(scenario.id); if (e.key === "Escape") setRenamingId(null); }}
                    onBlur={() => commitRename(scenario.id)}
                    className="min-w-0 flex-1 rounded-lg bg-white px-2 py-1 text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLoad(scenario)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {scenario.label}
                      {scenario.source && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {scenario.source}
                        </span>
                      )}
                    </div>
                    {scenario.subtitle && (
                      <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{scenario.subtitle}</div>
                    )}
                  </button>
                )}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startRename(scenario); }}
                    aria-label="Rename scenario"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(scenario.id); }}
                    aria-label="Delete scenario"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-700 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
