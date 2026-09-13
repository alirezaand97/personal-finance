"use client";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { useFinance } from "@/components/providers/FinanceProvider";
export default function SettingsRoute() {
  const f = useFinance();
  return <SettingsScreen settings={f.settings} onSettings={f.setSettings} onRefresh={f.refresh} />;
}
