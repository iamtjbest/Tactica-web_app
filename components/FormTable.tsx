import type { Match } from "@/lib/api";
import clsx from "clsx";

const RES_STYLE: Record<string, string> = {
  W: "bg-grn text-bg",
  D: "bg-amber text-bg",
  L: "bg-red  text-white",
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function FormTable({ matches, teamName, attack, defence, cached }: {
  matches: Match[]; teamName: string; attack: number; defence: number; cached?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <p className="section-label">{teamName}</p>
        {cached && <span className="text-mt text-[10px] font-mono ml-auto">📦 cached</span>}
      </div>
      <div className="flex gap-3 mb-3">
        <div className="bg-bg2 rounded-lg px-3 py-2 text-center">
          <p className="font-mono text-[10px] text-mt uppercase tracking-wider mb-0.5">Attack</p>
          <p className="font-display font-black text-2xl text-volt">{attack}</p>
        </div>
        <div className="bg-bg2 rounded-lg px-3 py-2 text-center">
          <p className="font-mono text-[10px] text-mt uppercase tracking-wider mb-0.5">Defence</p>
          <p className="font-display font-black text-2xl text-cyan">{defence}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {matches.map((m, i) => (
          <div key={i} className="flex items-center gap-2 bg-bg2 rounded-lg px-3 py-2 text-sm">
            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded font-mono", RES_STYLE[m.result])}>{m.result}</span>
            <span className="text-white text-xs flex-1 truncate">vs {m.opponent}</span>
            <span className="text-mt text-xs">{m.scored}–{m.conceded}</span>
            {m.event_date && (
              <span className="text-mt2 text-[10px] font-mono">{formatDate(m.event_date)}</span>
            )}
            <code className="text-volt text-[10px] bg-sur px-1.5 py-0.5 rounded">{m.formation}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
