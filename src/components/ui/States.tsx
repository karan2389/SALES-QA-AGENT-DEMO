import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPrototypeSettings, setPrototypeSettings } from "@/services";
import { Button } from "./Button";

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton rounded-md", className)} aria-hidden />;

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink-muted">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, onDisableSimulation, simulated }: { error: Error; onRetry: () => void; onDisableSimulation?: () => void; simulated?: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-bad-soft text-bad"><AlertTriangle className="h-5 w-5" /></div>
      <p className="text-sm font-medium text-ink">We couldn&apos;t load this data</p>
      <p className="mt-1 max-w-md text-[13px] text-ink-muted">{error.message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button onClick={onRetry}>Try again</Button>
        {simulated && onDisableSimulation && <Button variant="ghost" onClick={onDisableSimulation}>Turn off simulated error</Button>}
      </div>
    </div>
  );
}

/** Standard loading / error / content switch for service-backed sections. */
export function QueryGate({ loading, error, hasData, onRetry, skeleton, children }: {
  loading: boolean; error: Error | null; hasData: boolean; onRetry: () => void; skeleton: ReactNode; children: ReactNode;
}) {
  if (error && !hasData) {
    const simulated = getPrototypeSettings().error;
    return <ErrorState error={error} onRetry={onRetry} simulated={simulated} onDisableSimulation={() => { setPrototypeSettings({ error: false }); onRetry(); }} />;
  }
  if (loading && !hasData) return <>{skeleton}</>;
  return <>{children}</>;
}
