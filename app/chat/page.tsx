import type { Metadata } from "next";
import { ChatHub, type ChatHubTab } from "@/components/chat-hub";

export const metadata: Metadata = {
  title: "Chat",
  description: "Find nearby Baguio travelers and continue your anonymous conversations in one place.",
};

type ChatPageProps = {
  searchParams: Promise<{ tab?: string; conversation?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const initialTab: ChatHubTab = params.conversation || params.tab === "messages" ? "messages" : "nearby";

  return (
    <main id="main-content" className="chats-page chat-hub-page">
      <ChatHub initialTab={initialTab} />
    </main>
  );
}
