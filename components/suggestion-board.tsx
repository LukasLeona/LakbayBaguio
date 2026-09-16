"use client";

import {
  Accessibility,
  ArrowUp,
  Bug,
  CheckCircle2,
  Clock3,
  Lightbulb,
  LoaderCircle,
  MapPinned,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ensureAnonymousIdentity, getSupabaseBrowserClient, isCommunityConfigured } from "@/lib/supabase/client";
import { TurnstileWidget, turnstileEnabled } from "./turnstile-widget";

type SuggestionCategory = "feature" | "improvement" | "content" | "accessibility" | "bug";
type SortMode = "top" | "new";

type Suggestion = {
  id: string;
  title: string;
  body: string;
  category: SuggestionCategory;
  status: "open" | "planned" | "shipped" | "closed";
  created_at: string;
  vote_count: number;
  has_voted: boolean;
};

const categoryOptions = [
  { value: "all", label: "All ideas", icon: Lightbulb },
  { value: "feature", label: "New feature", icon: Sparkles },
  { value: "improvement", label: "Improvement", icon: Wrench },
  { value: "content", label: "Places & content", icon: MapPinned },
  { value: "accessibility", label: "Accessibility", icon: Accessibility },
  { value: "bug", label: "Bug report", icon: Bug },
] as const;

const statusLabels: Record<Suggestion["status"], string> = {
  open: "Open idea",
  planned: "On the roadmap",
  shipped: "Added to the app",
  closed: "Closed",
};

function friendlyDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "Something went wrong.";
  if (message.includes("Suggestion limit reached")) return "You’ve shared three ideas this hour. Give the board a little breather, then try again.";
  if (message.includes("Anonymous sign-in")) return "Complete the private security check first, then try again.";
  return message;
}

async function withTimeout<T>(request: PromiseLike<T>, milliseconds = 12_000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("The idea board took too long to respond.")), milliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function SuggestionBoard() {
  const configured = isCommunityConfigured();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sort, setSort] = useState<SortMode>("top");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]["value"]>("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [needsSecurity, setNeedsSecurity] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [titleLength, setTitleLength] = useState(0);
  const [bodyLength, setBodyLength] = useState(0);

  const loadSuggestions = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await withTimeout(client.rpc("list_suggestions", {
        p_sort: sort,
        p_category: category === "all" ? null : category,
      }));
      if (error) throw error;
      setSuggestions((data ?? []).map((item: Suggestion) => ({ ...item, vote_count: Number(item.vote_count) })));
    } catch {
      setNotice({ kind: "error", text: "The idea board is taking a quick pine break. Please refresh in a moment." });
      setSuggestions([]);
    }
    setLoading(false);
  }, [category, sort]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const client = getSupabaseBrowserClient();
    client?.auth.getSession().then(({ data }) => setNeedsSecurity(turnstileEnabled && !data.session));
  }, [configured]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const boardStats = useMemo(() => ({
    ideas: suggestions.length,
    votes: suggestions.reduce((sum, suggestion) => sum + suggestion.vote_count, 0),
  }), [suggestions]);

  async function ensureIdentity() {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("The community database is not configured yet.");
    const { data } = await client.auth.getSession();
    if (!data.session && turnstileEnabled && !turnstileToken) {
      setNeedsSecurity(true);
      throw new Error("Anonymous sign-in is required");
    }
    await ensureAnonymousIdentity(client, turnstileToken || undefined);
    setNeedsSecurity(false);
    setTurnstileToken("");
    return client;
  }

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    setNotice(null);
    try {
      const client = await ensureIdentity();
      const { error } = await client.rpc("create_suggestion", {
        p_title: String(formData.get("title") ?? ""),
        p_body: String(formData.get("body") ?? ""),
        p_category: String(formData.get("category") ?? "improvement"),
      });
      if (error) throw error;
      form.reset();
      setTitleLength(0);
      setBodyLength(0);
      setCategory("all");
      setSort("new");
      setNotice({ kind: "success", text: "Idea shared—anonymously and ready for the community to vote on." });
      await loadSuggestions();
    } catch (error) {
      setNotice({ kind: "error", text: readableError(error) });
    } finally {
      setSending(false);
    }
  }

  async function toggleVote(suggestionId: string) {
    setPendingVote(suggestionId);
    setNotice(null);
    try {
      const client = await ensureIdentity();
      const { data, error } = await client.rpc("toggle_suggestion_vote", { p_suggestion_id: suggestionId });
      if (error) throw error;
      const voted = Boolean(data);
      setSuggestions((current) => current.map((suggestion) => suggestion.id === suggestionId ? {
        ...suggestion,
        has_voted: voted,
        vote_count: Math.max(0, suggestion.vote_count + (voted ? 1 : -1)),
      } : suggestion));
    } catch (error) {
      setNotice({ kind: "error", text: readableError(error) });
    } finally {
      setPendingVote(null);
    }
  }

  return (
    <>
      <section className="suggestion-hero">
        <div className="shell suggestion-hero-inner">
          <div className="suggestion-hero-copy">
            <span className="eyebrow light"><MessageSquareText size={15} /> Community idea board</span>
            <h1>Small idea, <em>better Baguio Buddy.</em></h1>
            <p>Share what would make the app more useful, or lift up an idea you want us to build. No public names—just good suggestions.</p>
            <div className="suggestion-hero-promise"><ShieldCheck /><span><strong>Anonymous by design</strong><small>Your name and account ID never appear on the board.</small></span></div>
          </div>
          <div className="suggestion-hero-stats" aria-label="Idea board totals">
            <div><strong>{boardStats.ideas}</strong><span>ideas shown</span></div>
            <div><strong>{boardStats.votes}</strong><span>community votes</span></div>
            <div className="suggestion-spark"><Lightbulb /><span>Built with<br />travelers</span></div>
          </div>
        </div>
      </section>

      <section className="shell suggestion-layout">
        <aside className="suggestion-composer">
          <div className="suggestion-composer-heading">
            <span><Lightbulb /></span>
            <div><small>Got an idea?</small><h2>Suggest something</h2></div>
          </div>
          <p>Tell us what could make planning, exploring, Nearby, or chat feel better.</p>
          <form onSubmit={submitSuggestion}>
            <label>
              <span>Short title <i>{titleLength}/100</i></span>
              <input name="title" required minLength={5} maxLength={100} onInput={(event) => setTitleLength(event.currentTarget.value.length)} placeholder="e.g. Save favorite restaurants" />
            </label>
            <label>
              <span>Category</span>
              <select name="category" defaultValue="improvement">
                {categoryOptions.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>What should improve? <i>{bodyLength}/800</i></span>
              <textarea name="body" required minLength={15} maxLength={800} rows={5} onInput={(event) => setBodyLength(event.currentTarget.value.length)} placeholder="Describe the problem, your idea, and why it would help travelers…" />
            </label>
            {needsSecurity ? (
              <div className="suggestion-security">
                <ShieldCheck />
                <div><strong>One quick security check</strong><small>This keeps spam off the board without asking for your name.</small></div>
                <TurnstileWidget action="suggestion" onToken={setTurnstileToken} />
              </div>
            ) : null}
            <button className="button primary full" type="submit" disabled={sending || !configured}>
              {sending ? <LoaderCircle className="spin" /> : <Send />}{sending ? "Sharing…" : "Share anonymously"}
            </button>
          </form>
          <small className="suggestion-composer-note">One anonymous account can post up to three ideas per hour and vote once per idea.</small>
        </aside>

        <div className="suggestion-feed">
          <div className="suggestion-toolbar">
            <div><span className="eyebrow">Community picks</span><h2>Ideas from fellow travelers</h2></div>
            <div className="suggestion-sort" aria-label="Sort suggestions">
              <button type="button" className={sort === "top" ? "active" : ""} onClick={() => setSort("top")}><ArrowUp /> Top</button>
              <button type="button" className={sort === "new" ? "active" : ""} onClick={() => setSort("new")}><Clock3 /> New</button>
            </div>
          </div>

          <div className="suggestion-filters" aria-label="Filter suggestions">
            {categoryOptions.map(({ value, label, icon: Icon }) => (
              <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}><Icon /> {label}</button>
            ))}
          </div>

          {notice ? <div className={`suggestion-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.kind === "success" ? <CheckCircle2 /> : <Lightbulb />}<span>{notice.text}</span></div> : null}

          {!configured ? (
            <div className="suggestion-empty"><span><Wrench /></span><h3>The idea board needs its database connection.</h3><p>Add the Supabase environment settings to start collecting anonymous suggestions.</p></div>
          ) : loading ? (
            <div className="suggestion-loading" aria-label="Loading suggestions"><i /><i /><i /></div>
          ) : suggestions.length === 0 ? (
            <div className="suggestion-empty"><span><Lightbulb /></span><h3>Fresh board, wide-open possibilities.</h3><p>Be the first traveler to share an idea in this category.</p></div>
          ) : (
            <div className="suggestion-list">
              {suggestions.map((suggestion) => {
                const option = categoryOptions.find((item) => item.value === suggestion.category) ?? categoryOptions[0];
                const Icon = option.icon;
                return (
                  <article className="suggestion-card" key={suggestion.id}>
                    <div className="suggestion-card-top">
                      <span className={`suggestion-category category-${suggestion.category}`}><Icon />{option.label}</span>
                      <span className={`suggestion-status status-${suggestion.status}`}>{statusLabels[suggestion.status]}</span>
                    </div>
                    <h3>{suggestion.title}</h3>
                    <p>{suggestion.body}</p>
                    <footer>
                      <span><ShieldCheck /> Anonymous traveler · {friendlyDate(suggestion.created_at)}</span>
                      <button type="button" className={suggestion.has_voted ? "voted" : ""} disabled={pendingVote === suggestion.id} onClick={() => void toggleVote(suggestion.id)} aria-label={`${suggestion.has_voted ? "Remove upvote from" : "Upvote"} ${suggestion.title}`}>
                        {pendingVote === suggestion.id ? <LoaderCircle className="spin" /> : <ArrowUp />}
                        <strong>{suggestion.vote_count}</strong><small>{suggestion.has_voted ? "Upvoted" : "Upvote"}</small>
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
