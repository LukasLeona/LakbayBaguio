import { SuggestionBoard } from "@/components/suggestion-board";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata(
  "Suggestions",
  "Share an anonymous idea for Baguio Buddy or upvote improvements from other travelers.",
);

export default function SuggestionsPage() {
  return (
    <main id="main-content" className="suggestions-page">
      <SuggestionBoard />
    </main>
  );
}
