import type { FormationResult } from "@/lib/api";

const MEDALS = ["🥇","🥈","🥉","4️⃣","5️⃣"];

export default function FormationBar({ items }: { items: FormationResult[] }) {
  const top5 = items.slice(0, 5);
  const max  = top5[0]?.probability || 100;
  return (
    <div className="space-y-3">
      {top5.map((f, i) => (
        <div key={f.formation} className="flex items-center gap-3">
          <span className="text-lg w-7">{MEDALS[i]}</span>
          <span className="text-white font-display font-bold w-28 text-sm">{f.formation}</span>
          <div className="flex-1 bg-bg2 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-volt to-volt2 transition-all"
              style={{ width: `${(f.probability / max) * 100}%` }} />
          </div>
          <span className="text-volt font-bold font-mono text-sm w-14 text-right">{f.probability}%</span>
        </div>
      ))}
    </div>
  );
}
