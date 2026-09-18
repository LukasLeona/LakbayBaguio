import type { Metadata } from "next";
import { WallExperience } from "@/components/wall-experience";

export const metadata: Metadata = {
  title: "Baguio Wall",
  description: "Share a Baguio moment anonymously and send a little love to stories from fellow travelers.",
};

export default function WallPage() {
  return (
    <main id="main-content" className="wall-page">
      <WallExperience />
    </main>
  );
}
