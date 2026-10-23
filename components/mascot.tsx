import Image from "next/image";

interface Props {
  /** "face" is the head only, for small avatars; "full" is the whole buddy waving. */
  variant?: "face" | "full";
  className?: string;
  priority?: boolean;
}

/** The dino buddy. Decorative: the text next to it always carries the meaning. */
export function Mascot({ variant = "full", className = "", priority = false }: Props) {
  return variant === "face" ? (
    <Image src="/brand/mascot-face.png" alt="" width={144} height={144} className={className} priority={priority} />
  ) : (
    <Image src="/brand/mascot.png" alt="" width={480} height={525} className={className} priority={priority} />
  )
}
