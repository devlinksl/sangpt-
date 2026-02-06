import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 mb-2">
        {title}
      </h3>
      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}
