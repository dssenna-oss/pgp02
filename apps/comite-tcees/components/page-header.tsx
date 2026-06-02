import { EditHint } from "@/components/edit-hint";

export function PageHeader({
  emoji,
  title,
  lead,
  editHint,
  action,
}: {
  emoji?: string;
  title: string;
  lead?: string;
  /** Trecho de ajuda mostrado só para quem pode editar (ADMIN/COORDENADOR). */
  editHint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[22px] font-extrabold text-gray-900 flex items-center gap-2.5">
          {emoji && <span>{emoji}</span>}
          {title}
        </h1>
        {lead && (
          <p className="text-gray-500 text-[13.5px] mt-1 max-w-[760px]">
            {lead}
            {editHint && <EditHint text={editHint} />}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
