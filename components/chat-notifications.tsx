"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isCommunityConfigured } from "@/lib/supabase/client";

export const CHAT_READ_EVENT = "baguio-buddy-chat-read";

type ChatNotificationsValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
};

const ChatNotificationsContext = createContext<ChatNotificationsValue>({ unreadCount: 0, refreshUnread: async () => undefined });

export function ChatNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !userId) {
      setUnreadCount(0);
      return;
    }
    const { data, error } = await client.rpc("unread_message_count");
    if (!error) setUnreadCount(Math.max(0, Number(data) || 0));
  }, [userId]);

  useEffect(() => {
    if (!isCommunityConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user.id || "");
    });
    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id || "");
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    void refreshUnread();
    const channel = client.channel(`unread-messages-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refreshUnread())
      .subscribe();
    const onRead = () => void refreshUnread();
    window.addEventListener(CHAT_READ_EVENT, onRead);
    const timer = window.setInterval(() => void refreshUnread(), 60_000);
    return () => {
      window.removeEventListener(CHAT_READ_EVENT, onRead);
      window.clearInterval(timer);
      void client.removeChannel(channel);
    };
  }, [refreshUnread, userId]);

  const value = useMemo(() => ({ unreadCount, refreshUnread }), [refreshUnread, unreadCount]);
  return <ChatNotificationsContext.Provider value={value}>{children}</ChatNotificationsContext.Provider>;
}

export function useChatNotifications() {
  return useContext(ChatNotificationsContext);
}

export function UnreadBadge({ className = "nav-unread-badge" }: { className?: string }) {
  const { unreadCount } = useChatNotifications();
  if (unreadCount < 1) return null;
  return <i className={className} aria-label={`${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"}`}>{unreadCount > 99 ? "99+" : unreadCount}</i>;
}
