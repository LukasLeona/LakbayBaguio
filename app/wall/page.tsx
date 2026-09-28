import { WallExperience } from "@/components/wall-experience";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata(
  "Baguio Wall",
  "Share a Baguio moment anonymously and send a little love to stories from fellow travelers.",
);

export default function WallPage() {
  return (
    <main id="main-content" className="wall-page">
      <WallExperience />
    </main>
  );
}
