import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #042f2e 0%, #0f766e 52%, #99f6e4 100%)",
          color: "#ecfeff",
          fontSize: 160,
          fontWeight: 800,
          letterSpacing: "-0.06em"
        }}
      >
        SK
      </div>
    ),
    size
  );
}
