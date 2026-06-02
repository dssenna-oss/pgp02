import { ShieldCheck } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
          light ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
        }`}
      >
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-extrabold text-sm ${light ? "text-white" : "text-gray-900"}`}>
          Comitê LGPD
        </span>
        <span
          className={`text-[10px] uppercase tracking-wide ${
            light ? "text-slate-300" : "text-gray-500"
          }`}
        >
          TCE-ES · Proteção de Dados
        </span>
      </div>
    </div>
  );
}
