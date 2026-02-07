import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { Bell, MessageCircle, Download, AlertTriangle } from 'lucide-react';

interface Props {
  onBack: () => void;
  notifications: boolean;
  onToggleNotifications: (v: boolean) => void;
}

export function NotificationsSubPage({ onBack, notifications, onToggleNotifications }: Props) {
  return (
    <SettingsSubPage title="Notifications" onBack={onBack}>
      <SettingsSection title="General">
        <SettingsItem
          icon={<Bell className="h-[18px] w-[18px]" />}
          label="All Notifications"
          description="Master toggle for all notifications"
          toggle
          toggled={notifications}
          onToggle={onToggleNotifications}
          index={0}
        />
      </SettingsSection>

      <SettingsSection title="Categories">
        <SettingsItem
          icon={<MessageCircle className="h-[18px] w-[18px]" />}
          label="Message Notifications"
          description="AI response completion alerts"
          toggle
          toggled={notifications}
          onToggle={onToggleNotifications}
          index={1}
        />
        <SettingsItem
          icon={<Download className="h-[18px] w-[18px]" />}
          label="Update Notifications"
          description="New features and improvements"
          toggle
          toggled={notifications}
          onToggle={onToggleNotifications}
          index={2}
        />
        <SettingsItem
          icon={<AlertTriangle className="h-[18px] w-[18px]" />}
          label="System Alerts"
          description="Service status and maintenance"
          toggle
          toggled={notifications}
          onToggle={onToggleNotifications}
          index={3}
        />
      </SettingsSection>
    </SettingsSubPage>
  );
}
