import type { LiveResponse } from "@/lib/api";

export default function LiveBadge({ data }: { data: LiveResponse }) {
  if (!data.match_found) return null;
  return (
    <div className="bg-volt/8 border border-volt/25 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-grn animate-pulse" />
        <span className="text-grn text-xs font-mono font-bold tracking-widest uppercase">Live</span>
        <span className="text-mt text-xs">{data.competition}</span>
        {data.cached && <span className="text-mt text-xs ml-auto">cached</span>}
        {data.stale  && <span className="text-amber text-xs ml-auto">stale</span>}
      </div>
      <div className="flex items-center justify-center gap-6 py-1">
        <span className="text-white font-semibold text-sm">{data.home_team}</span>
        <span className="font-display font-black text-3xl text-volt">{data.home_score} – {data.away_score}</span>
        <span className="text-white font-semibold text-sm">{data.away_team}</span>
      </div>
      <p className="text-center text-mt text-xs mt-1">⏱️ {data.minute}&apos;</p>
    </div>
  );
}
