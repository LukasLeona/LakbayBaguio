import type { Metadata } from "next";
import { SuggestionBoard } from "@/components/suggestion-board";

export const metadata: Metadata = {
  title: "Suggestions",
  description: "Share an anonymous idea for Baguio Buddy or upvote improvements from other travelers.",
};

export default function SuggestionsPage() {
  return (
    <main id="main-content" className="suggestions-page">
      <SuggestionBoard />
    </main>
  );
}
