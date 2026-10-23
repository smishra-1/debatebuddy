import { Mascot } from "./mascot";

interface Props {
  author: string;
  /** An emoji, or "mascot" for the dino buddy. */
  avatar: string;
  mine: boolean;
  /** Omit to show the "is typing" dots while the reply is on its way. */
  content?: string;
  /** Label read out instead of the dots, e.g. "Fiona is thinking…". */
  typingLabel?: string;
}

/** AI and student text is rendered as plain text (never HTML), so it can't inject markup. */
export function MessageBubble({ author, avatar, content, mine, typingLabel }: Props) {
  return (
    <div className={`flex animate-pop-in items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <span
        aria-hidden
        className={`grid size-10 shrink-0 place-items-center rounded-full text-2xl ${mine ? "bg-primary/15" : "bg-help-soft"}`}
      >
        {avatar === "mascot" ? <Mascot variant="face" className="size-full object-contain p-0.5" /> : avatar}
      </span>
      <div className={`flex max-w-[85%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <span className="mb-1 px-1 text-sm font-bold text-muted">{author}</span>
        {content === undefined ? (
          <p className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border-2 border-border bg-background px-5 py-4">
            <span className="sr-only">{typingLabel}</span>
            <span aria-hidden className="typing-dot size-2.5 rounded-full bg-muted" />
            <span aria-hidden className="typing-dot size-2.5 rounded-full bg-muted" />
            <span aria-hidden className="typing-dot size-2.5 rounded-full bg-muted" />
          </p>
        ) : (
          <p
            className={`whitespace-pre-wrap break-words rounded-3xl px-5 py-3 text-lg leading-relaxed ${
              mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border-2 border-border bg-background"
            }`}
          >
            {content}
          </p>
        )}
      </div>
    </div>
  );
}
