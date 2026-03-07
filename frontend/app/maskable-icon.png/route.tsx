import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 72,
          background: "#0f766e"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 96,
            background: "linear-gradient(145deg, #042f2e 0%, #0f766e 60%, #99f6e4 100%)",
            color: "#ecfeff",
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: "-0.06em"
          }}
        >
          SK
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512
    }
  );
}
