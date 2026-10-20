import { SettingsView } from "@/components/settings-view";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.settings.title);

export default function Page() {
  return <SettingsView />;
}
