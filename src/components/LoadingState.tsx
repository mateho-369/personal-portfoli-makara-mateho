export default function LoadingState({ label = 'Gathering the morning light…' }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 text-[#5E6959]" role="status">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border border-[#D9A441]/30" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#D9A441]" />
        <span className="absolute inset-[14px] rounded-full bg-[#6E7C52]" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}
