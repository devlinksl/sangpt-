import { ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  badge?: string;
  trailing?: React.ReactNode;
  toggle?: boolean;
  toggled?: boolean;
  onToggle?: (checked: boolean) => void;
  destructive?: boolean;
  index?: number;
}

export function SettingsItem({
  icon,
  label,
  description,
  onClick,
  badge,
  trailing,
  toggle,
  toggled,
  onToggle,
  destructive,
  index = 0,
}: SettingsItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 settings-item-enter',
        onClick && 'active:scale-[0.98] cursor-pointer hover:bg-accent/60',
        destructive && 'text-destructive'
      )}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
          destructive
            ? 'bg-destructive/10 text-destructive'
            : 'bg-accent/80 text-muted-foreground'
        )}
      >
        {icon}
      </div>

      {/* Label + Description */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-[15px] font-medium leading-tight', destructive && 'text-destructive')}>
          {label}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>

      {/* Trailing */}
      {badge && (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-ai-blue/20 text-ai-blue font-semibold uppercase tracking-wide">
          {badge}
        </span>
      )}
      {trailing && <span className="text-xs text-muted-foreground">{trailing}</span>}
      {toggle ? (
        <Switch checked={toggled} onCheckedChange={onToggle} />
      ) : onClick ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : null}
    </div>
  );

  return content;
}
