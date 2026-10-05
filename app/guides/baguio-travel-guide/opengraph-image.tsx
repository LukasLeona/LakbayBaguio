import { ImageResponse } from "next/og";

export const alt = "Baguio Buddy complete Baguio travel guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px 76px",
        color: "#fffdf5",
        background: "linear-gradient(135deg, #082c22 0%, #174d3c 68%, #47786a 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "54px", height: "54px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "18px", color: "#082c22", background: "#d7e43c", fontSize: "21px", fontWeight: 800 }}>BB</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#d7e43c", fontSize: "18px", fontWeight: 800, letterSpacing: "3px" }}>BAGUIO BUDDY</span>
          <span style={{ color: "rgba(255,255,255,.68)", fontSize: "18px" }}>Commuter-first trip planning</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "990px" }}>
        <span style={{ marginBottom: "16px", color: "#f6b843", fontSize: "24px", fontWeight: 800 }}>2026 COMPLETE GUIDE</span>
        <div style={{ fontSize: "68px", lineHeight: 1.02, fontWeight: 800, letterSpacing: "-3px" }}>Plan a Baguio trip that works beyond the checklist.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "13px", fontSize: "23px", color: "rgba(255,255,255,.74)" }}>
        <span>48 places</span><span>•</span><span>7 route loops</span><span>•</span><span>DIY commute</span><span>•</span><span>3D2N budget</span>
      </div>
    </div>,
    size,
  );
}

