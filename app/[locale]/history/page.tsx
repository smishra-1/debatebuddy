import { HistoryView } from "@/components/history-view";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.history.title);

export default function Page() {
  return <HistoryView />;
}
