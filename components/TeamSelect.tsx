"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { EUROPEAN_TEAMS } from "@/lib/api";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  teams?: string[];
  id?: string;
  disabled?: boolean;
}

export default function TeamSelect({ label, value, onChange, teams, id, disabled }: Props) {
  const list = teams || EUROPEAN_TEAMS;
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [focused, setFocused] = useState(-1);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);

  const filtered = query.trim().length === 0
    ? list
    : list.filter(t => t.toLowerCase().includes(query.toLowerCase()));

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setFocused(-1);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focused >= 0 && listRef.current) {
      const item = listRef.current.children[focused] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [focused]);

  const selectItem = useCallback((team: string) => {
    onChange(team);
    setOpen(false);
    setQuery("");
    setFocused(-1);
  }, [onChange]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown")      { setFocused(f => Math.min(f + 1, filtered.length - 1)); e.preventDefault(); }
    else if (e.key === "ArrowUp")   { setFocused(f => Math.max(f - 1, 0)); e.preventDefault(); }
    else if (e.key === "Enter" && focused >= 0) { selectItem(filtered[focused]); e.preventDefault(); }
    else if (e.key === "Escape")    { setOpen(false); setQuery(""); setFocused(-1); }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-mt text-xs font-semibold mb-1.5 tracking-wide uppercase" htmlFor={id}>
        {label}
      </label>

      {/* Trigger — shows selected value */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen(o => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        onKeyDown={handleKeyDown}
        className="input-select text-left flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full"
      >
        <span className="truncate">{value || "Select a team…"}</span>
        <svg
          className={`w-4 h-4 text-mt shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-sur border border-bd rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-bd">
            <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-mt shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setFocused(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search 130+ clubs…"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-mt2 outline-none"
              />
              {query && (
                <button onClick={() => { setQuery(""); setFocused(-1); inputRef.current?.focus(); }}
                  className="text-mt hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul ref={listRef} className="overflow-y-auto" style={{ maxHeight: "220px" }}>
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-mt text-sm text-center">
                No teams found for &ldquo;{query}&rdquo;
              </li>
            ) : (
              filtered.map((team, i) => {
                const isSelected = team === value;
                const isFocused  = i === focused;
                return (
                  <li key={team}
                    onMouseDown={() => selectItem(team)}
                    onMouseEnter={() => setFocused(i)}
                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-volt/10 text-volt"
                        : isFocused
                        ? "bg-sur2 text-white"
                        : "text-mt hover:bg-sur2 hover:text-white"
                    }`}>
                    <span>{team}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-volt shrink-0" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {query && filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-bd text-[10px] text-mt2 font-mono">
              {filtered.length} of {list.length} teams
            </div>
          )}
        </div>
      )}
    </div>
  );
}
