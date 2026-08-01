import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="group inline-flex items-center gap-3" aria-label="Field Notes home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-[#6E7C52]/30 bg-[#F8F4E9]">
        <span className="absolute bottom-2 h-px w-6 bg-gradient-to-r from-[#6E7C52] via-[#D9A441] to-[#5C7A89]" />
        <span className="absolute bottom-[9px] h-2.5 w-2.5 rounded-full bg-[#D9A441]/70 blur-[1px] transition-transform duration-500 group-hover:-translate-y-0.5" />
      </span>
      <span className="font-serif text-[1.05rem] font-semibold tracking-[-0.02em] text-[#2B3328]">Field Notes</span>
    </Link>
  );
}
