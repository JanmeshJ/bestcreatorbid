import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#F4EFE8",
          color: "#1A1714",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: "#FF5A1F", letterSpacing: 4 }}>
          THE CREATOR LEADERBOARD MONEY DECIDES
        </div>
        <div style={{ marginTop: 24, fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>
          Think you&apos;re the best creator?
        </div>
        <div style={{ marginTop: 12, fontSize: 72, fontWeight: 800, color: "#FF5A1F" }}>PROVE IT.</div>
        <div style={{ marginTop: 28, fontSize: 28 }}>bestcreatorbid.lol</div>
      </div>
    ),
    size
  );
}
