import type { Metadata } from "next";
import { isLocale } from "./config";
import { getDictionary } from "./get-dictionary";
import type { Dictionary } from "./dictionaries/en";

/** `generateMetadata` for a page whose title comes from the dictionary; private pages stay out of search. */
export function localeMetadata(title: (dict: Dictionary) => string, { index = false } = {}) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    if (!isLocale(locale)) return {};
    return { title: title(await getDictionary(locale)), ...(index ? {} : { robots: { index: false } }) };
  };
}
