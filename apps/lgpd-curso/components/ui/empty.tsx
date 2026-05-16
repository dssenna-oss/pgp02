import { Inbox } from "lucide-react";

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
      <Inbox className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
