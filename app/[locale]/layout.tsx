import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { themeInitScript } from "@/lib/client/theme";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/provider";
import "../globals.css";

// Rounded, very legible letterforms for young readers; Devanagari falls back to Noto.
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: { default: dict.meta.title, template: `%s · ${dict.meta.title}` }, description: dict.meta.description };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${nunito.variable} ${devanagari.variable} h-full antialiased`}
      // The inline script below may set data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} dict={dict}>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            {dict.common.skipToContent}
          </a>
          {/* Header reads the pathname, which is only known per request on dynamic routes. */}
          <Suspense fallback={<div className="h-[62px] border-b-2 border-border" />}>
            <Header />
          </Suspense>
          <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
          <footer className="border-t-2 border-border py-6 text-center text-sm text-muted">
            <p className="mx-auto max-w-5xl px-4">{dict.footer.text}</p>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
