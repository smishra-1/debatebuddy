const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-lg font-extrabold transition-[background-color,border-color,color,box-shadow,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-50";

/** Chunky "game" button: a darker bottom edge that presses down when tapped. */
export const btnPrimary = `${base} bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-depth)] hover:bg-primary-hover active:translate-y-[3px] active:shadow-[0_1px_0_var(--primary-depth)] disabled:translate-y-0 disabled:shadow-[0_4px_0_var(--primary-depth)]`;
export const btnSecondary = `${base} border-2 border-border bg-card text-foreground shadow-[0_3px_0_var(--border)] hover:border-primary active:translate-y-[2px] active:shadow-[0_1px_0_var(--border)] disabled:translate-y-0`;
export const btnDanger = `${base} border-2 border-against/40 bg-card text-against hover:bg-against/10`;
/** Small pill button for secondary actions (suggestions, "Use it", "Practise this"). */
export const btnChip =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-base font-bold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";
export const textLink = "inline-flex items-center gap-1 font-bold text-primary underline-offset-4 hover:underline";

export const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm sm:p-6";
export const input =
  "w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-lg text-foreground transition-colors placeholder:text-muted/70 focus:border-primary disabled:opacity-60";
export const errorBox = "rounded-2xl border-2 border-against/40 bg-against/10 p-3 text-against";

/** Selectable tile wrapping a visually hidden radio; shows a tick in the corner when picked. */
export const choiceTile =
  "group relative flex cursor-pointer rounded-2xl border-2 border-border bg-card p-4 transition-[border-color,background-color,transform] duration-150 hover:border-good/60 active:scale-[0.98] has-[:checked]:border-good has-[:checked]:bg-good-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60";
export const choiceTick =
  "absolute -right-2 -top-2 hidden size-6 animate-pop-in place-items-center rounded-full bg-good text-sm font-black text-card ring-3 ring-background group-has-[:checked]:grid";
