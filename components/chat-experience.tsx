"use client";

import Link from "next/link";
import { ArrowLeft, Ban, Check, CheckCheck, ChevronRight, Flag, Inbox, MapPinned, MessageCircle, MoreHorizontal, Search, Send, ShieldAlert, UserRoundX, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { TravelerAvatar } from "./traveler-avatar";
import { ensureAnonymousIdentity, getSupabaseBrowserClient, isCommunityConfigured } from "@/lib/supabase/client";

type Conversation = {
  conversation_id: string;
  partner_id: string;
  partner_alias: string;
  avatar_seed: number;
  distance_band: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type ChatRequest = { request_id: string; sender_id: string; sender_alias: string; avatar_seed: number; created_at: string };
type ChatMessage = { id: number; conversation_id: string; sender_id: string; body: string; created_at: string };

const previewConversations: Conversation[] = [
  { conversation_id: "preview-conversation", partner_id: "preview-1", partner_alias: "MistyHiker27", avatar_seed: 1, distance_band: "Active now", last_message: "I’m heading toward the Botanical Garden next.", last_message_at: new Date(Date.now() - 4 * 60_000).toISOString(), unread_count: 1 },
  { conversation_id: "preview-conversation-2", partner_id: "preview-2", partner_alias: "PineRobin08", avatar_seed: 5, distance_band: "Offline", last_message: "Thanks for the café tip!", last_message_at: new Date(Date.now() - 3_600_000).toISOString(), unread_count: 0 },
];
const previewMessages: ChatMessage[] = [
  { id: 1, conversation_id: "preview-conversation", sender_id: "preview-1", body: "Hi! Is Burnham Park crowded right now?", created_at: new Date(Date.now() - 12 * 60_000).toISOString() },
  { id: 2, conversation_id: "preview-conversation", sender_id: "me", body: "A little busy near the lake, but the Rose Garden side is calmer.", created_at: new Date(Date.now() - 9 * 60_000).toISOString() },
  { id: 3, conversation_id: "preview-conversation", sender_id: "preview-1", body: "Nice, thank you! I’m heading toward the Botanical Garden next.", created_at: new Date(Date.now() - 4 * 60_000).toISOString() },
];

function relativeTime(value: string | null) {
  if (!value) return "New";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

export function ChatExperience() {
  const configured = isCommunityConfigured();
  const [userId, setUserId] = useState(configured ? "" : "me");
  const [alias, setAlias] = useState(configured ? "Anonymous traveler" : "PreviewPine31");
  const [conversations, setConversations] = useState<Conversation[]>(configured ? [] : previewConversations);
  const [requests, setRequests] = useState<ChatRequest[]>(configured ? [] : [{ request_id: "request-1", sender_id: "preview-3", sender_alias: "CozyTaho54", avatar_seed: 2, created_at: new Date().toISOString() }]);
  const [activeId, setActiveId] = useState<string | null>(configured ? null : "preview-conversation");
  const [messages, setMessages] = useState<ChatMessage[]>(configured ? [] : previewMessages);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(configured ? "" : "Preview mode — connect Supabase for live chat.");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeConversation = conversations.find((item) => item.conversation_id === activeId) || null;
  const filteredConversations = useMemo(() => conversations.filter((item) => item.partner_alias.toLowerCase().includes(query.toLowerCase().trim())), [conversations, query]);

  const refreshLists = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const [{ data: conversationData, error: conversationError }, { data: requestData, error: requestError }] = await Promise.all([
      client.rpc("list_conversations"),
      client.rpc("list_chat_requests"),
    ]);
    if (conversationError) throw conversationError;
    if (requestError) throw requestError;
    setConversations((conversationData || []) as Conversation[]);
    setRequests((requestData || []) as ChatRequest[]);
  }, []);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const initialize = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      try {
        const identity = await ensureAnonymousIdentity(client);
        if (cancelled) return;
        setUserId(identity.user.id);
        setAlias(identity.alias);
        await refreshLists();
      } catch {
        if (!cancelled) setNotice("Chat could not connect. Check the Supabase configuration and anonymous sign-in setting.");
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [configured, refreshLists]);

  useEffect(() => {
    if (!configured || !userId) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const channel = client.channel(`inbox-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_requests", filter: `receiver_id=eq.${userId}` }, () => void refreshLists())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refreshLists())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [configured, refreshLists, userId]);

  useEffect(() => {
    if (!configured || !activeId) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let cancelled = false;
    const load = async () => {
      const { data, error } = await client.from("messages").select("id, conversation_id, sender_id, body, created_at").eq("conversation_id", activeId).order("created_at", { ascending: true }).limit(200);
      if (!cancelled && !error) setMessages((data || []) as ChatMessage[]);
      await client.rpc("mark_conversation_read", { p_conversation_id: activeId });
    };
    void load();
    const channel = client.channel(`conversation-${activeId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` }, (payload) => {
      const incoming = payload.new as ChatMessage;
      setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      void client.rpc("mark_conversation_read", { p_conversation_id: activeId });
    }).subscribe();
    return () => { cancelled = true; void client.removeChannel(channel); };
  }, [activeId, configured]);

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileOpen(true);
    if (!configured) setMessages(id === "preview-conversation" ? previewMessages : [{ id: 4, conversation_id: id, sender_id: "preview-2", body: "Thanks for the café tip!", created_at: new Date(Date.now() - 3_600_000).toISOString() }]);
  }

  async function respond(requestId: string, accept: boolean) {
    if (!configured) {
      const request = requests.find((item) => item.request_id === requestId);
      setRequests((current) => current.filter((item) => item.request_id !== requestId));
      if (accept && request) {
        const conversation: Conversation = { conversation_id: `preview-${request.sender_id}`, partner_id: request.sender_id, partner_alias: request.sender_alias, avatar_seed: request.avatar_seed, distance_band: "Active now", last_message: null, last_message_at: null, unread_count: 0 };
        setConversations((current) => [conversation, ...current]);
        setActiveId(conversation.conversation_id);
        setMessages([]);
        setMobileOpen(true);
      }
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.rpc("respond_to_chat_request", { p_request_id: requestId, p_accept: accept });
    if (error) { setNotice(error.message); return; }
    await refreshLists();
    if (accept && data) { setActiveId(data as string); setMobileOpen(true); }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean || !activeId || clean.length > 600) return;
    setMessage("");
    if (!configured) {
      setMessages((current) => [...current, { id: Date.now(), conversation_id: activeId, sender_id: userId, body: clean, created_at: new Date().toISOString() }]);
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.from("messages").insert({ conversation_id: activeId, sender_id: userId, body: clean }).select("id, conversation_id, sender_id, body, created_at").single();
    if (error) { setNotice(error.message); setMessage(clean); return; }
    setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data as ChatMessage]);
    await refreshLists();
  }

  async function safetyAction(action: "report" | "block" | "end") {
    if (!activeConversation || !activeId) return;
    if (!configured) {
      setNotice(`${action === "report" ? "Report submitted" : action === "block" ? "Traveler blocked" : "Conversation ended"} in preview mode.`);
      if (action !== "report") { setConversations((current) => current.filter((item) => item.conversation_id !== activeId)); setActiveId(null); setMobileOpen(false); }
      setMenuOpen(false);
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const result = action === "report"
      ? await client.from("reports").insert({ reporter_id: userId, reported_id: activeConversation.partner_id, conversation_id: activeId, reason: "other", details: "Reported from the conversation safety menu." })
      : await client.rpc(action === "block" ? "block_user" : "end_conversation", action === "block" ? { p_user_id: activeConversation.partner_id } : { p_conversation_id: activeId });
    if (result.error) setNotice(result.error.message);
    else setNotice(action === "report" ? "Report submitted for review." : action === "block" ? "Traveler blocked." : "Conversation ended.");
    setMenuOpen(false);
    if (action !== "report") { setActiveId(null); setMobileOpen(false); await refreshLists(); }
  }

  return (
    <div className={`chat-shell ${mobileOpen ? "mobile-chat-open" : ""}`}>
      <aside className="chat-sidebar">
        <header><div><span className="eyebrow">Anonymous as</span><h1>{alias}</h1></div><Link href="/nearby" aria-label="Find nearby travelers"><MapPinned /></Link></header>
        <label className="chat-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" /></label>
        {requests.length > 0 && <section className="request-section"><div className="list-label"><span>Chat requests</span><b>{requests.length}</b></div>{requests.map((request) => <article className="request-card" key={request.request_id}><TravelerAvatar alias={request.sender_alias} seed={request.avatar_seed} /><div><strong>{request.sender_alias}</strong><small>Wants to start a chat</small><span><button type="button" onClick={() => respond(request.request_id, true)}><Check size={15} /> Accept</button><button type="button" onClick={() => respond(request.request_id, false)} aria-label="Decline"><X size={15} /></button></span></div></article>)}</section>}
        <section className="conversation-section"><div className="list-label"><span>Messages</span><b>{conversations.reduce((total, item) => total + Number(item.unread_count), 0) || ""}</b></div>{filteredConversations.length ? <div className="conversation-list">{filteredConversations.map((conversation) => <button type="button" key={conversation.conversation_id} className={activeId === conversation.conversation_id ? "active" : ""} onClick={() => selectConversation(conversation.conversation_id)}><span className="avatar-wrap"><TravelerAvatar alias={conversation.partner_alias} seed={conversation.avatar_seed} /><i className={conversation.distance_band === "Active now" ? "online" : ""} /></span><span className="conversation-preview"><strong>{conversation.partner_alias}<time>{relativeTime(conversation.last_message_at)}</time></strong><small>{conversation.last_message || "New conversation"}</small></span>{Number(conversation.unread_count) > 0 && <b>{conversation.unread_count}</b>}<ChevronRight className="conversation-chevron" size={17} /></button>)}</div> : <div className="sidebar-empty"><MessageCircle /><strong>No conversations</strong><p>Find someone on Nearby and send a chat request.</p><Link href="/nearby">Open Nearby</Link></div>}</section>
        {notice && <p className="chat-notice">{notice}</p>}
      </aside>

      <section className="chat-room">
        {activeConversation ? <>
          <header className="chat-room-header"><button className="mobile-back" type="button" onClick={() => setMobileOpen(false)} aria-label="Back to conversations"><ArrowLeft /></button><TravelerAvatar alias={activeConversation.partner_alias} seed={activeConversation.avatar_seed} /><div><strong>{activeConversation.partner_alias}</strong><span><i className={activeConversation.distance_band === "Active now" ? "online" : ""} /> {activeConversation.distance_band}</span></div><div className="chat-menu"><button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Conversation options"><MoreHorizontal /></button>{menuOpen && <div className="chat-menu-popover"><button type="button" onClick={() => safetyAction("report")}><Flag /> Report conversation</button><button type="button" onClick={() => safetyAction("block")}><Ban /> Block traveler</button><button type="button" onClick={() => safetyAction("end")}><UserRoundX /> End conversation</button></div>}</div></header>
          <div className="chat-safety-strip"><ShieldAlert size={15} /><span>Keep personal details private. Block and report anything unsafe.</span></div>
          <div className="message-list" aria-live="polite">
            <div className="conversation-start"><TravelerAvatar alias={activeConversation.partner_alias} seed={activeConversation.avatar_seed} size="large" /><strong>You matched anonymously</strong><p>Neither traveler can see the other’s exact location.</p></div>
            {messages.map((item, index) => {
              const mine = item.sender_id === userId;
              const previous = messages[index - 1];
              const showTime = !previous || new Date(item.created_at).getTime() - new Date(previous.created_at).getTime() > 5 * 60_000;
              return <div key={item.id} className={`message-row ${mine ? "mine" : "theirs"}`}>{showTime && <time>{new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>}<div className="message-bubble">{item.body}</div>{mine && <CheckCheck size={13} />}</div>;
            })}
          </div>
          <form className="message-composer" onSubmit={sendMessage}><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={600} rows={1} placeholder="Write a message…" aria-label="Message" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><span>{message.length}/600</span><button type="submit" aria-label="Send message" disabled={!message.trim()}><Send /></button></form>
        </> : <div className="chat-room-empty"><div><Inbox /></div><h2>Your traveler conversations</h2><p>Select a chat, or use Nearby to find someone exploring around you.</p><Link className="button primary" href="/nearby"><MapPinned size={17} /> Find nearby travelers</Link></div>}
      </section>
    </div>
  );
}
