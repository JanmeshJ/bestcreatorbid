import { ImageResponse } from "next/og";
import { getCreatorBySlug } from "@/lib/data";
import { formatUsd } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCreatorBySlug(slug);
  const name = data?.creator.display_name || slug;
  const rank = data?.entry?.current_rank || "-";
  const bid = data?.entry?.total_bid_cents ? formatUsd(data.entry.total_bid_cents) : "$0";
  const initial = name.slice(0, 1).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#F4EFE8",
          color: "#1A1714",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#111",
              color: "#FF5A1F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            ▶
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>bestcreatorbid.lol</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 999,
              background: "#FF5A1F",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 800,
            }}
          >
            {initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 800 }}>{name}</div>
            <div style={{ marginTop: 8, fontSize: 36, fontWeight: 800, color: "#FF5A1F" }}>
              #{rank} BEST CREATOR
            </div>
            <div style={{ marginTop: 8, fontSize: 32 }}>{bid} on the board</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
