import { BadgesView } from "@/components/badges-view";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.badgesPage.title);

export default function Page() {
  return <BadgesView />;
}
