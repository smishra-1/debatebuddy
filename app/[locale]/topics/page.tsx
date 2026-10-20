import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { TopicSuggester } from "@/components/topic-suggester";
import { btnPrimary, card } from "@/components/styles";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { sampleTopics } from "@/lib/topics";

export async function generateMetadata({ params }: PageProps<"/[locale]/topics">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { topics } = await getDictionary(locale);
  return { title: topics.title, description: topics.subtitle };
}

export default async function TopicsPage({ params }: PageProps<"/[locale]/topics">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { topics } = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <BackButton fallback={`/${locale}`} />
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-balance">{topics.title}</h1>
        <p className="text-lg text-muted">{topics.subtitle}</p>
      </header>

      <ul className="space-y-4">
        {sampleTopics.map((topic) => {
          const sample = topic.sample[locale];
          return (
            <li key={topic.id} className={`${card} space-y-4`}>
              <div className="flex items-start gap-4">
                <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-3xl">
                  {topic.emoji}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-primary">{topics.categories[topic.category]}</p>
                  <h2 className="text-xl font-extrabold text-balance">{topic.question[locale]}</h2>
                </div>
              </div>
              <details className="group">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl text-lg font-bold text-primary hover:underline [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  <span className="group-open:hidden">{topics.show}</span>
                  <span className="hidden group-open:inline">{topics.hide}</span>
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {(["agree", "disagree"] as const).map((side) => (
                    <div
                      key={side}
                      className={`rounded-2xl border-2 p-4 ${side === "agree" ? "border-good/30 bg-good-soft" : "border-next/30 bg-next-soft"}`}
                    >
                      <p className={`text-lg font-extrabold ${side === "agree" ? "text-good" : "text-next"}`}>
                        {side === "agree" ? "👍" : "👎"} {side === "agree" ? topics.agreeSide : topics.disagreeSide}
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {sample[side].map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
              <Link href={`/${locale}/setup?topic=${topic.id}`} className={btnPrimary}>
                {topics.practiceThis} <span aria-hidden>→</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <TopicSuggester />
    </div>
  );
}
