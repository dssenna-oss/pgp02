import { Badge } from "@/components/ui/badge";

export function PageHeader({
  missao,
  titulo,
  descricao,
  actions,
}: {
  missao: string;
  titulo: string;
  descricao?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div>
        <Badge variant="ghost" className="mb-1">{missao}</Badge>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{descricao}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
