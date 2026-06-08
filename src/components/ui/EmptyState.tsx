import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-ink-100 flex items-center justify-center text-ink-400 mb-4">
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
