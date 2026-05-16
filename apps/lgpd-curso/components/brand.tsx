import { Shield } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Shield className="h-6 w-6 text-brand-600" />
        <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold text-training-600 bg-white px-0.5 rounded">
          TR
        </span>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-semibold text-sm">PGP Treinamento</span>
          <span className="text-[10px] text-gray-500">Curso prático de LGPD</span>
        </div>
      )}
    </div>
  );
}
