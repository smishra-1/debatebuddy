import { Landing } from "@/components/landing";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.landing.title, { index: true });

export default function Page() {
  return <Landing />;
}
