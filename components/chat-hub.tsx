"use client";

import { MapPinned, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatExperience } from "./chat-experience";
import { UnreadBadge } from "./chat-notifications";
import { NearbyExperience } from "./nearby-experience";

export type ChatHubTab = "nearby" | "messages";

export function ChatHub({ initialTab }: { initialTab: ChatHubTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<ChatHubTab>(initialTab);

  useEffect(() => setTab(initialTab), [initialTab]);

  function chooseTab(nextTab: ChatHubTab) {
    setTab(nextTab);
    router.replace(`/chat?tab=${nextTab}`, { scroll: false });
  }

  return (
    <>
      <section className="chat-hub-hero shell">
        <div>
          <span className="eyebrow light"><Sparkles /> Traveler connections</span>
          <h1>Meet nearby. <em>Talk right away.</em></h1>
          <p>Use the private radar to discover other Baguio travelers, then keep every anonymous conversation in one friendly place.</p>
        </div>
        <div className="chat-hub-promise"><ShieldCheck /><span><strong>Private by design</strong><small>Approximate location · anonymous names · chats you can end anytime</small></span></div>
      </section>

      <section className="shell chat-hub-workspace">
        <nav className="chat-hub-tabs" aria-label="Chat tools">
          <button type="button" className={tab === "nearby" ? "active" : ""} aria-pressed={tab === "nearby"} onClick={() => chooseTab("nearby")}>
            <span><MapPinned /></span><span><strong>Nearby</strong><small>Find travelers on the radar</small></span>
          </button>
          <button type="button" className={tab === "messages" ? "active" : ""} aria-pressed={tab === "messages"} onClick={() => chooseTab("messages")}>
            <span><MessageCircle /></span><span><strong>Messages</strong><small>Continue your conversations</small></span><UnreadBadge className="chat-hub-unread" />
          </button>
        </nav>

        <div className={`chat-hub-panel ${tab === "messages" ? "messages-panel" : "nearby-panel-view"}`}>
          {tab === "nearby" ? <NearbyExperience /> : <ChatExperience />}
        </div>
      </section>
    </>
  );
}
