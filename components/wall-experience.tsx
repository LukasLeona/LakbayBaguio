"use client";

import {
  Camera,
  CheckCircle2,
  Clock3,
  Flag,
  Heart,
  ImagePlus,
  LoaderCircle,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ensureAnonymousIdentity, getSupabaseBrowserClient, isCommunityConfigured } from "@/lib/supabase/client";
import {
  prepareWallPhoto,
  previewWallPosts,
  removeWallPhoto,
  uploadWallPhoto,
  WALL_POST_LIMIT,
  wallErrorMessage,
  wallPhotoPublicUrl,
  wallRelativeTime,
  withWallTimeout,
  type PreparedWallPhoto,
  type WallPost,
  type WallReportReason,
  type WallSort,
} from "@/lib/wall";
import { TurnstileWidget, turnstileEnabled } from "./turnstile-widget";

const reportReasons: Array<{ value: WallReportReason; label: string }> = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "unsafe", label: "Unsafe or harmful content" },
  { value: "private_information", label: "Shares private information" },
  { value: "other", label: "Something else" },
];

type Notice = { kind: "success" | "error"; text: string };

export function WallExperience() {
  const configured = isCommunityConfigured();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<WallPost[]>(configured ? [] : previewWallPosts);
  const [sort, setSort] = useState<WallSort>("recent");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<PreparedWallPhoto | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [loading, setLoading] = useState(configured);
  const [sending, setSending] = useState(false);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WallPost | null>(null);
  const [reporting, setReporting] = useState<WallPost | null>(null);
  const [reportReason, setReportReason] = useState<WallReportReason>("spam");
  const [menuPost, setMenuPost] = useState<string | null>(null);
  const [needsSecurity, setNeedsSecurity] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const clearPreparedPhoto = useCallback(() => {
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  const loadPosts = useCallback(async (quiet = false) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setPosts(previewWallPosts);
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await withWallTimeout(client.rpc("list_wall_posts", {
        p_sort: sort,
        p_limit: 50,
        p_offset: 0,
      }));
      if (error) throw error;
      setPosts((data ?? []).map((item: WallPost) => ({
        ...item,
        reaction_count: Number(item.reaction_count),
      })));
    } catch {
      if (!quiet) setNotice({ kind: "error", text: "The Wall is taking a quick pine break. Please refresh in a moment." });
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void loadPosts();
    if (!configured) return;
    const timer = window.setInterval(() => void loadPosts(true), 45_000);
    return () => window.clearInterval(timer);
  }, [configured, loadPosts]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getUser().then(({ data }) => setNeedsSecurity(turnstileEnabled && !data.user));
  }, []);

  async function ensureIdentity() {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("The community database is not configured yet.");
    const { data } = await client.auth.getUser();
    if (!data.user && turnstileEnabled && !turnstileToken) {
      setNeedsSecurity(true);
      throw new Error("Anonymous sign-in is required");
    }
    const identity = await ensureAnonymousIdentity(client, turnstileToken || undefined);
    setNeedsSecurity(false);
    setTurnstileToken("");
    return { client, identity };
  }

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setPreparingPhoto(true);
    setNotice(null);
    try {
      const prepared = await prepareWallPhoto(file);
      clearPreparedPhoto();
      setPhoto(prepared);
    } catch (error) {
      setNotice({ kind: "error", text: wallErrorMessage(error) });
      event.currentTarget.value = "";
    } finally {
      setPreparingPhoto(false);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() && !photo) {
      setNotice({ kind: "error", text: "Add a thought, a photo, or both before sharing." });
      return;
    }
    setSending(true);
    setNotice(null);
    let uploadedPath: string | null = null;
    try {
      const { client, identity } = await ensureIdentity();
      if (photo) uploadedPath = await uploadWallPhoto(client, identity.user.id, photo);
      const { error } = await withWallTimeout(client.rpc("create_wall_post", {
        p_body: body.trim(),
        p_photo_path: uploadedPath,
      }));
      if (error) throw error;
      setBody("");
      clearPreparedPhoto();
      setSort("recent");
      setNotice({ kind: "success", text: "Shared anonymously. Your story is now part of the Wall." });
      await loadPosts();
    } catch (error) {
      if (uploadedPath) {
        const client = getSupabaseBrowserClient();
        if (client) await removeWallPhoto(client, uploadedPath).catch(() => undefined);
      }
      setNotice({ kind: "error", text: wallErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }

  async function toggleReaction(post: WallPost) {
    if (!configured) {
      setPosts((current) => current.map((item) => item.id === post.id ? {
        ...item,
        has_reacted: !item.has_reacted,
        reaction_count: Math.max(0, item.reaction_count + (item.has_reacted ? -1 : 1)),
      } : item));
      return;
    }
    setPendingReaction(post.id);
    setNotice(null);
    try {
      const { client } = await ensureIdentity();
      const { data, error } = await withWallTimeout(client.rpc("toggle_wall_reaction", { p_post_id: post.id }));
      if (error) throw error;
      const reacted = Boolean(data);
      setPosts((current) => current.map((item) => item.id === post.id ? {
        ...item,
        has_reacted: reacted,
        reaction_count: Math.max(0, item.reaction_count + (reacted ? 1 : -1)),
      } : item));
    } catch (error) {
      setNotice({ kind: "error", text: wallErrorMessage(error) });
    } finally {
      setPendingReaction(null);
    }
  }

  async function deletePost() {
    if (!pendingDelete) return;
    setSending(true);
    try {
      const { client } = await ensureIdentity();
      const { data: photoPath, error } = await withWallTimeout(client.rpc("delete_wall_post", { p_post_id: pendingDelete.id }));
      if (error) throw error;
      if (typeof photoPath === "string" && photoPath) await removeWallPhoto(client, photoPath).catch(() => undefined);
      setPosts((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setNotice({ kind: "success", text: "Your post was removed from the Wall." });
    } catch (error) {
      setNotice({ kind: "error", text: wallErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }

  async function submitReport() {
    if (!reporting) return;
    setSending(true);
    try {
      const { client } = await ensureIdentity();
      const { error } = await withWallTimeout(client.rpc("report_wall_post", {
        p_post_id: reporting.id,
        p_reason: reportReason,
      }));
      if (error) throw error;
      setReporting(null);
      setMenuPost(null);
      setNotice({ kind: "success", text: "Thanks. The post was privately reported for review." });
    } catch (error) {
      setNotice({ kind: "error", text: wallErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="wall-shell">
      <section className="wall-intro shell">
        <div className="wall-intro-copy">
          <span className="eyebrow light"><Sparkles /> Baguio freedom wall</span>
          <h1>Leave a little piece of your <em>Baguio story.</em></h1>
          <p>Happy, heavy, hilarious, or simply worth remembering. Share it without sharing your name.</p>
          <div className="wall-promise"><ShieldCheck /><span><strong>No names. No pressure.</strong><small>Posts and reactions appear anonymously.</small></span></div>
        </div>
        <div className="wall-quote" aria-hidden="true">
          <Heart />
          <p>“The fog lifted just when I needed it to.”</p>
          <span>— someone in Baguio</span>
        </div>
      </section>

      <section className="shell wall-layout">
        <aside className="wall-compose-card">
          <div className="wall-compose-heading"><span><Camera /></span><div><small>Your corner</small><h2>What&apos;s on your mind?</h2></div></div>
          <form onSubmit={submitPost}>
            <label className="wall-text-field">
              <span className="sr-only">Your anonymous post</span>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={WALL_POST_LIMIT} rows={6} placeholder="Kwento mo lang. This is your little corner of Baguio…" />
              <small>{body.length}/{WALL_POST_LIMIT}</small>
            </label>
            {photo ? (
              <div className="wall-photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt="Photo ready to share" />
                <button type="button" onClick={clearPreparedPhoto} aria-label="Remove selected photo"><X /></button>
                <span>Location details removed</span>
              </div>
            ) : null}
            {needsSecurity ? (
              <div className="wall-security"><ShieldCheck /><div><strong>One private security check</strong><small>Keeps bots away without asking for your name.</small></div><TurnstileWidget action="wall_post" onToken={setTurnstileToken} /></div>
            ) : null}
            <div className="wall-compose-actions">
              <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
              <button type="button" className="wall-photo-button" disabled={preparingPhoto || Boolean(photo)} onClick={() => fileInputRef.current?.click()}>
                {preparingPhoto ? <LoaderCircle className="spin" /> : <ImagePlus />} {preparingPhoto ? "Preparing…" : "Add photo"}
              </button>
              <button type="submit" className="button primary" disabled={sending || preparingPhoto || !configured}>
                {sending ? <LoaderCircle className="spin" /> : <Send />} {sending ? "Sharing…" : "Post anonymously"}
              </button>
            </div>
          </form>
          <p className="wall-compose-note"><ShieldCheck /> Photos are resized and stripped of hidden location metadata before upload.</p>
        </aside>

        <div className="wall-feed">
          <div className="wall-feed-heading">
            <div><span className="eyebrow">From fellow travelers</span><h2>The Wall</h2></div>
            <div className="wall-sort" aria-label="Sort Wall posts">
              <button type="button" className={sort === "recent" ? "active" : ""} onClick={() => setSort("recent")}><Clock3 /> New</button>
              <button type="button" className={sort === "loved" ? "active" : ""} onClick={() => setSort("loved")}><Heart /> Loved</button>
            </div>
          </div>

          {!configured ? <div className="wall-preview-note"><Sparkles /><span><strong>Preview mode</strong> Connect Supabase to let travelers publish.</span></div> : null}
          {notice ? <div className={`wall-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.kind === "success" ? <CheckCircle2 /> : <ShieldCheck />}<span>{notice.text}</span></div> : null}

          {loading ? (
            <div className="wall-loading" aria-label="Loading Wall posts"><i /><i /><i /></div>
          ) : posts.length === 0 ? (
            <div className="wall-empty"><span><Heart /></span><h3>The Wall is waiting for its first story.</h3><p>A thought, a memory, or a little Baguio moment is enough.</p></div>
          ) : (
            <div className="wall-post-list">
              {posts.map((post) => {
                const client = getSupabaseBrowserClient();
                const photoUrl = client ? wallPhotoPublicUrl(client, post.photo_path) : null;
                return (
                  <article className="wall-post-card" key={post.id}>
                    <header>
                      <span className="wall-avatar"><Sparkles /></span>
                      <div><strong>{post.is_owner ? "Your anonymous post" : "Anonymous traveler"}</strong><small>{wallRelativeTime(post.created_at)}</small></div>
                      <div className="wall-post-menu">
                        <button type="button" aria-label="Post options" aria-expanded={menuPost === post.id} onClick={() => setMenuPost((current) => current === post.id ? null : post.id)}><MoreHorizontal /></button>
                        {menuPost === post.id ? <div>{post.is_owner ? <button type="button" onClick={() => { setPendingDelete(post); setMenuPost(null); }}><Trash2 /> Delete my post</button> : <button type="button" onClick={() => setReporting(post)}><Flag /> Report privately</button>}</div> : null}
                      </div>
                    </header>
                    {photoUrl ? <div className="wall-post-photo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoUrl} alt="Photo shared by an anonymous Baguio traveler" loading="lazy" /></div> : null}
                    {post.body ? <p>{post.body}</p> : null}
                    <footer>
                      <button type="button" className={post.has_reacted ? "loved" : ""} disabled={pendingReaction === post.id} onClick={() => void toggleReaction(post)} aria-label={`${post.has_reacted ? "Remove heart from" : "Heart"} this post`}>
                        {pendingReaction === post.id ? <LoaderCircle className="spin" /> : <Heart fill={post.has_reacted ? "currentColor" : "none"} />}<strong>{post.reaction_count}</strong><span>{post.has_reacted ? "Loved" : "Send love"}</span>
                      </button>
                      <small>Anonymous reactions only</small>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {reporting ? <div className="wall-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReporting(null); }}><section className="wall-dialog" role="dialog" aria-modal="true" aria-labelledby="wall-report-title"><button className="wall-dialog-close" type="button" onClick={() => setReporting(null)} aria-label="Close"><X /></button><span className="wall-dialog-icon"><Flag /></span><h2 id="wall-report-title">Report this post?</h2><p>Your report stays private. Choose the closest reason so it can be reviewed properly.</p><label><span>Reason</span><select value={reportReason} onChange={(event) => setReportReason(event.target.value as WallReportReason)}>{reportReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select></label><div className="wall-dialog-actions"><button type="button" className="button outline" onClick={() => setReporting(null)}>Cancel</button><button type="button" className="button primary" disabled={sending} onClick={() => void submitReport()}>{sending ? <LoaderCircle className="spin" /> : <Flag />} Report privately</button></div></section></div> : null}

      {pendingDelete ? <div className="wall-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null); }}><section className="wall-dialog" role="alertdialog" aria-modal="true" aria-labelledby="wall-delete-title"><button className="wall-dialog-close" type="button" onClick={() => setPendingDelete(null)} aria-label="Close"><X /></button><span className="wall-dialog-icon danger"><Trash2 /></span><h2 id="wall-delete-title">Remove your post?</h2><p>The story, photo, and its reactions will be permanently deleted.</p><div className="wall-dialog-actions"><button type="button" className="button outline" onClick={() => setPendingDelete(null)}>Keep it</button><button type="button" className="button danger" disabled={sending} onClick={() => void deletePost()}>{sending ? <LoaderCircle className="spin" /> : <Trash2 />} Delete post</button></div></section></div> : null}
    </div>
  );
}
