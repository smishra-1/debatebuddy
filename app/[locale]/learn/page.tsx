import { Flashcards } from "@/components/flashcards";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.learn.title, { index: true });

export default function Page() {
  return <Flashcards />;
}
