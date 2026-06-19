import type { Player } from "@/lib/api";
import clsx from "clsx";

const POS_COLOR: Record<string, string> = {
  GK: "border-l-amber", DF: "border-l-blue-400",
  MF: "border-l-volt",  FW: "border-l-red",
};

export default function PlayerCard({ player }: { player: Player }) {
  const badge = player.spec_pos && !["G","D","M","F"].includes(player.spec_pos)
    ? player.spec_pos : player.pos;
  const ga = typeof player.g_a === "number" ? player.g_a.toFixed(2) : player.g_a;
  return (
    <div className={clsx(
      "flex items-center justify-between px-4 py-3 rounded-xl",
      "bg-bg border border-bd border-l-2 transition-all hover:border-bd2",
      POS_COLOR[player.pos] || "border-l-bd2"
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="pos-badge">{badge}</span>
        <span className="text-white text-sm font-semibold truncate">{player.name}</span>
        {player.fallback && <span className="text-amber text-xs">⚠️</span>}
      </div>
      <div className="flex gap-3 stat-chip shrink-0 ml-2">
        <span>⏱ {player.minutes}m</span>
        <span>⚽ {ga}</span>
      </div>
    </div>
  );
}
