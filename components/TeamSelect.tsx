"use client";
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
  return (
    <div>
      <label className="block text-mt text-xs font-semibold mb-1.5 tracking-wide uppercase" htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="input-select disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {list.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}
