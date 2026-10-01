export type OfficialSuggestionReply = {
  author: "Kabsat";
  body: string;
  repliedAt: string;
  status: "shipped";
};

const officialReplies: Record<string, OfficialSuggestionReply> = {
  "e901096e-57f8-44a3-a4ab-a642c9d0f68d": {
    author: "Kabsat",
    body: "Salamat for this thoughtful suggestion! We’ve now added hotel and Airbnb check-in to the itinerary planner. Travelers can enter their stay, check-in day and time, and checkout time so Baguio Buddy can arrange sightseeing, luggage, rest, and the route around those fixed moments. Your idea helped make the planner more practical for early arrivals and real travel days—thank you for helping us improve it.",
    repliedAt: "2026-10-01T00:00:00+08:00",
    status: "shipped",
  },
};

export function officialSuggestionReply(suggestionId: string) {
  return officialReplies[suggestionId] ?? null;
}
