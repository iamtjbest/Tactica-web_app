export default function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-sur border border-bd border-l-2 border-l-volt rounded-xl px-4 py-3 text-center">
      <p className="text-mt text-xs mb-1">{label}</p>
      <p className="font-display font-black text-2xl text-volt">{value}</p>
      {sub && <p className="text-mt text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}
