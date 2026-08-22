import type { PlatformId } from "@/lib/platforms";
import { cn } from "@/lib/utils";

function IconFrame({
  className,
  color,
  children,
}: {
  className?: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg text-white", className)}
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

export function PlatformIcon({
  id,
  className,
  size = "md",
}: {
  id: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-5 w-5 rounded-md" : "h-7 w-7";
  const svg = "h-3.5 w-3.5";
  switch (id as PlatformId) {
    case "youtube":
      return (
        <IconFrame className={cn(box, className)} color="#FF0000">
          <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
            <path d="M8 7.5v9l8-4.5-8-4.5Z" />
          </svg>
        </IconFrame>
      );
    case "instagram":
      return (
        <IconFrame className={cn(box, className)} color="#E1306C">
          <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="4" />
            <circle cx="12" cy="12" r="3.5" />
            <circle cx="17" cy="7" r="0.8" fill="currentColor" />
          </svg>
        </IconFrame>
      );
    case "tiktok":
      return (
        <IconFrame className={cn(box, className)} color="#111">
          <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
            <path d="M14 4v9.2a3.2 3.2 0 1 1-2.4-3.1V7.2A6 6 0 0 0 18 9.4V6.7A6.7 6.7 0 0 1 14 4Z" />
          </svg>
        </IconFrame>
      );
    case "x":
      return (
        <IconFrame className={cn(box, className)} color="#111">
          <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
            <path d="M5 5h3.3l4 5.4L16.8 5H19l-6.2 7.6L19.4 19h-3.3l-4.3-5.8L7.2 19H5l6.5-8L5 5Z" />
          </svg>
        </IconFrame>
      );
    case "facebook":
      return (
        <IconFrame className={cn(box, className)} color="#1877F2">
          <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
            <path d="M13.5 19v-6h2l.3-2.5h-2.3V9.2c0-.7.2-1.2 1.2-1.2h1.2V5.8c-.2 0-1-.1-2-0.1-2 0-3.4 1.2-3.4 3.5v1.3H8.3V13h2.2v6h3Z" />
          </svg>
        </IconFrame>
      );
    case "twitch":
      return (
        <IconFrame className={cn(box, className)} color="#9146FF">
          <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
            <path d="M6 5h12v8.5L14.5 17H12l-2 2H8.5v-2H6V5Zm2 1.5v8h2.2v2l2-2H15l2-2v-6H8Z" />
          </svg>
        </IconFrame>
      );
    case "linkedin":
      return (
        <IconFrame className={cn(box, className)} color="#0A66C2">
          <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
            <path d="M7.5 9.5H5V19h2.5V9.5ZM6.2 5A1.5 1.5 0 1 0 6.3 8a1.5 1.5 0 0 0-.1-3ZM19 19h-2.5v-5.1c0-1.4-.5-2.3-1.7-2.3-1 0-1.5.7-1.7 1.3-.1.2-.1.5-.1.8V19H10.5s.0-8.4 0-9.5H13v1.3c.3-.5 1.2-1.5 3-1.5 2.2 0 3.8 1.4 3.8 4.5V19Z" />
          </svg>
        </IconFrame>
      );
    case "threads":
      return (
        <IconFrame className={cn(box, className)} color="#111">
          <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 8.5c3-2 8-.5 8 3.5 0 4-4 6.5-8 5.5" />
            <circle cx="12" cy="12" r="7" />
          </svg>
        </IconFrame>
      );
    case "snapchat":
      return (
        <IconFrame className={cn(box, className)} color="#FFFC00">
          <svg viewBox="0 0 24 24" className={cn(svg, "text-stone-900")} fill="currentColor">
            <path d="M12 5c2.5 0 4 1.8 4 4.2 0 1 .2 1.6.8 2.2.4.4.8.7.8 1.1 0 .6-.8.8-1.3 1-.3.1-.5.3-.3.7.3.8 1.6 1.3 1.6 1.8 0 .7-1.3.6-2 .5-.4 0-.6.2-.7.6-.2.8-.8 1.4-2.9 1.4s-2.7-.6-2.9-1.4c-.1-.4-.3-.6-.7-.6-.7.1-2 .2-2-.5 0-.5 1.3-1 1.6-1.8.2-.4 0-.6-.3-.7-.5-.2-1.3-.4-1.3-1 0-.4.4-.7.8-1.1.6-.6.8-1.2.8-2.2C8 6.8 9.5 5 12 5Z" />
          </svg>
        </IconFrame>
      );
    case "kick":
      return (
        <IconFrame className={cn(box, className)} color="#53FC18">
          <span className="text-[10px] font-black text-stone-900">K</span>
        </IconFrame>
      );
    case "patreon":
      return (
        <IconFrame className={cn(box, className)} color="#FF424D">
          <span className="text-[10px] font-black">P</span>
        </IconFrame>
      );
    case "substack":
      return (
        <IconFrame className={cn(box, className)} color="#FF6719">
          <span className="text-[10px] font-black">S</span>
        </IconFrame>
      );
    case "pinterest":
      return (
        <IconFrame className={cn(box, className)} color="#E60023">
          <span className="text-[10px] font-black">P</span>
        </IconFrame>
      );
    case "reddit":
      return (
        <IconFrame className={cn(box, className)} color="#FF4500">
          <span className="text-[10px] font-black">R</span>
        </IconFrame>
      );
    default:
      return (
        <IconFrame className={cn(box, className)} color="#FF5A1F">
          <span className="text-[10px] font-black">+</span>
        </IconFrame>
      );
  }
}
