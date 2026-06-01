import { iniciais } from "@/lib/utils";

/**
 * Avatar redondo do membro: mostra a foto (avatarUrl) quando houver, senão
 * cai nas iniciais sobre fundo navy. Tamanho controlável via `size` (px).
 */
export function Avatar({
  nome,
  avatarUrl,
  size = 42,
  className = "",
}: {
  nome: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={nome}
        style={dim}
        className={`rounded-full object-cover shrink-0 bg-slate-100 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...dim, fontSize: Math.round(size * 0.36) }}
      className={`rounded-full bg-navy text-white flex items-center justify-center font-bold shrink-0 ${className}`}
      aria-label={nome}
    >
      {iniciais(nome)}
    </div>
  );
}
