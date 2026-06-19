export default function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="bg-red/10 border border-red/30 text-red rounded-xl px-4 py-3 text-sm">
      🚨 {msg}
    </div>
  );
}
