import Image from "next/image";

interface Props {
  /** The app name; the first word is drawn in the text colour and the rest in the brand purple. */
  title: string;
  size?: "sm" | "lg";
  /** Hide the name on very narrow screens (the header), keeping just the mark. */
  compact?: boolean;
}

/** The two-bubble mark plus the name as live text, so it reads in both themes and both languages. */
export function Logo({ title, size = "sm", compact = false }: Props) {
  const [first, ...rest] = title.split(" ");
  const big = size === "lg";
  return (
    <span className={`flex items-center ${big ? "gap-3" : "gap-2"}`}>
      <Image
        src={big ? "/brand/mark-192.png" : "/brand/mark-96.png"}
        alt=""
        width={big ? 96 : 44}
        height={big ? 96 : 44}
        priority
        className={big ? "size-20 sm:size-24" : "size-11"}
      />
      <span
        className={`font-black tracking-tight whitespace-nowrap ${big ? "text-4xl sm:text-5xl" : "text-xl"} ${
          compact ? "hidden min-[400px]:inline" : ""
        }`}
      >
        {first}
        {rest.length > 0 && <span className="text-brand"> {rest.join(" ")}</span>}
      </span>
    </span>
  );
}
