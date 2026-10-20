import { HowToPlay } from "@/components/how-to-play";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.howTo.title, { index: true });

export default function Page() {
  return <HowToPlay />;
}
