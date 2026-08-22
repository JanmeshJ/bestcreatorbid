export function Hero({ platformLabel }: { platformLabel?: string }) {
  return (
    <div className="text-center lg:text-left">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">
        {platformLabel ? `${platformLabel} leaderboard` : "The creator leaderboard money decides"}
      </p>

      <h1 className="mt-1.5 text-[26px] font-black leading-[1.08] tracking-tight sm:text-[40px]">
        Think you&apos;re the
        <br />
        best{platformLabel ? ` ${platformLabel}` : " content"} creator?
        <span className="mt-0.5 block pb-3">
          {/* inline-block so the underline tracks the text width, not the column */}
          <span className="relative inline-block">
            <span className="font-marker block text-[32px] leading-none text-accent sm:text-[44px]">
              Prove it.
            </span>
            <svg
              viewBox="0 0 300 12"
              aria-hidden="true"
              className="absolute -bottom-2.5 left-0 h-2 w-full text-accent/55"
              preserveAspectRatio="none"
            >
              <path
                d="M4 8C56 3 126 2 188 6c36 2 74 4 108 1"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="animate-draw-underline"
              />
            </svg>
          </span>
        </span>
      </h1>

      <p className="mx-auto mt-1 hidden max-w-sm text-[14.5px] leading-relaxed text-muted sm:block lg:mx-0">
        Creators rank themselves by how much they&apos;re willing to bet on their own attention.
      </p>

      <p className="mt-1.5 text-[13px] font-bold sm:mt-2 sm:text-sm">No judges. No algorithm. Just ego.</p>
    </div>
  );
}
