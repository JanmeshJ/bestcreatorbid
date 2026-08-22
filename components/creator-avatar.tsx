import { avatarTone, cn, initials } from "@/lib/utils";

export function CreatorAvatar({
  name,
  src,
  size = "md",
  rounded = "full",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: "full" | "lg";
}) {
  const dims = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  }[size];
  const radius = rounded === "lg" ? "rounded-xl" : "rounded-full";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("object-cover", radius, dims)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-gradient-to-br font-bold text-white",
        avatarTone(name),
        radius,
        dims
      )}
    >
      {initials(name)}
    </span>
  );
}
