import type { Metadata } from "next";
import { ChatExperience } from "@/components/chat-experience";

export const metadata: Metadata = { title: "Chats" };

export default function ChatsPage() {
  return <main id="main-content" className="chats-page"><div className="shell"><ChatExperience /></div></main>;
}
