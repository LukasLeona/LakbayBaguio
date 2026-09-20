"use client";

import {
  CheckCircle2,
  Clock3,
  Flag,
  Heart,
  ImagePlus,
  LoaderCircle,
  MoreHorizontal,
  PencilLine,
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
  removeWallPhotos,
  uploadWallPhoto,
  WALL_MAX_PHOTOS,
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
  const preparedPhotosRef = useRef<PreparedWallPhoto[]>([]);
  const [posts, setPosts] = useState<WallPost[]>(configured ? [] : previewWallPosts);
  const [sort, setSort] = useState<WallSort>("recent");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PreparedWallPhoto[]>([]);
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
  const [composerOpen, setComposerOpen] = useState(false);

  const clearPreparedPhotos = useCallback(() => {
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePreparedPhoto = useCallback((index: number) => {
    setPhotos((current) => current.filter((photo, photoIndex) => {
      if (photoIndex === index) URL.revokeObjectURL(photo.previewUrl);
      return photoIndex !== index;
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    preparedPhotosRef.current = photos;
  }, [photos]);

  useEffect(() => () => {
    preparedPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  const loadPosts = useCallback(async (quiet = false) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setPosts(previewWallPosts);
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await withWallTimeout(client.rpc("list_wall_posts_v2", {
        p_sort: sort,
        p_limit: 50,
        p_offset: 0,
      }));
      if (error) throw error;
      setPosts((data ?? []).map((item: WallPost) => ({
        ...item,
        photo_paths: Array.isArray(item.photo_paths) ? item.photo_paths : [],
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

  useEffect(() => {
    if (!composerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) setComposerOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [composerOpen, sending]);

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

  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (!files.length) return;
    const availableSlots = WALL_MAX_PHOTOS - photos.length;
    if (files.length > availableSlots) {
      setNotice({ kind: "error", text: `Choose up to ${availableSlots} more ${availableSlots === 1 ? "photo" : "photos"}. Each post can have ${WALL_MAX_PHOTOS}.` });
      event.currentTarget.value = "";
      return;
    }
    setPreparingPhoto(true);
    setNotice(null);
    const prepared: PreparedWallPhoto[] = [];
    try {
      for (const file of files) prepared.push(await prepareWallPhoto(file));
      setPhotos((current) => [...current, ...prepared]);
    } catch (error) {
      prepared.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      setNotice({ kind: "error", text: wallErrorMessage(error) });
    } finally {
      event.currentTarget.value = "";
      setPreparingPhoto(false);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() && !photos.length) {
      setNotice({ kind: "error", text: "Add a thought, one or more photos, or both before sharing." });
      return;
    }
    setSending(true);
    setNotice(null);
    const uploadedPaths: string[] = [];
    try {
      const { client, identity } = await ensureIdentity();
      for (const photo of photos) uploadedPaths.push(await uploadWallPhoto(client, identity.user.id, photo));
      const { error } = await withWallTimeout(client.rpc("create_wall_post_v2", {
        p_body: body.trim(),
        p_photo_paths: uploadedPaths,
      }));
      if (error) throw error;
      setBody("");
      clearPreparedPhotos();
      setSort("recent");
      setNotice({ kind: "success", text: "Shared anonymously. Your story is now part of the Wall." });
      setComposerOpen(false);
      await loadPosts();
    } catch (error) {
      if (uploadedPaths.length) {
        const client = getSupabaseBrowserClient();
        if (client) await removeWallPhotos(client, uploadedPaths).catch(() => undefined);
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
      const { data: photoPaths, error } = await withWallTimeout(client.rpc("delete_wall_post_v2", { p_post_id: pendingDelete.id }));
      if (error) throw error;
      if (Array.isArray(photoPaths) && photoPaths.length) await removeWallPhotos(client, photoPaths).catch(() => undefined);
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
      <section className="shell wall-layout wall-layout-feed-only">
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
                const photoUrls = client ? post.photo_paths.map((path) => wallPhotoPublicUrl(client, path)) : [];
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
                    {photoUrls[0] ? <div className="wall-post-photo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoUrls[0]} alt="Photo shared by an anonymous Baguio traveler" loading="lazy" /></div> : null}
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

      <button className="wall-compose-fab" type="button" onClick={() => { setNotice(null); setComposerOpen(true); }} aria-label="Write an anonymous Wall post">
        <PencilLine />
      </button>

      {composerOpen ? (
        <div className="wall-compose-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) setComposerOpen(false); }}>
          <section className="wall-compose-card wall-compose-modal" role="dialog" aria-modal="true" aria-labelledby="wall-compose-title">
            <button className="wall-compose-close" type="button" onClick={() => setComposerOpen(false)} disabled={sending} aria-label="Close post composer"><X /></button>
            <div className="wall-compose-heading"><span><PencilLine /></span><div><small>Baguio freedom wall</small><h2 id="wall-compose-title">Share something</h2></div></div>
            <p className="wall-compose-intro">Kwento mo lang—your name will never appear on the post.</p>
            <form onSubmit={submitPost}>
              <label className="wall-text-field">
                <span className="sr-only">Your anonymous post</span>
                <textarea autoFocus value={body} onChange={(event) => setBody(event.target.value)} maxLength={WALL_POST_LIMIT} rows={6} placeholder="What happened in Baguio?" />
                <small>{body.length}/{WALL_POST_LIMIT}</small>
              </label>
              {photos.length ? (
                <div className="wall-photo-previews" aria-label={`${photos.length} selected ${photos.length === 1 ? "photo" : "photos"}`}>
                  {photos.map((photo, index) => <div className="wall-photo-preview" key={photo.previewUrl}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.previewUrl} alt={`Selected photo ${index + 1} of ${photos.length}`} />
                    <button type="button" onClick={() => removePreparedPhoto(index)} aria-label={`Remove selected photo ${index + 1}`}><X /></button>
                  </div>)}
                  <span>{photos.length}/{WALL_MAX_PHOTOS} · Location details removed</span>
                </div>
              ) : null}
              {needsSecurity ? (
                <div className="wall-security"><ShieldCheck /><div><strong>One private security check</strong><small>Keeps bots away without asking for your name.</small></div><TurnstileWidget action="wall_post" onToken={setTurnstileToken} /></div>
              ) : null}
              {notice?.kind === "error" ? <div className="wall-notice error" role="alert"><ShieldCheck /><span>{notice.text}</span></div> : null}
              <div className="wall-compose-actions">
                <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choosePhotos} />
                <button type="button" className="wall-photo-button" disabled={preparingPhoto || photos.length >= WALL_MAX_PHOTOS} onClick={() => fileInputRef.current?.click()}>
                  {preparingPhoto ? <LoaderCircle className="spin" /> : <ImagePlus />} {preparingPhoto ? "Preparing…" : photos.length ? "Add more" : "Add photos"}
                </button>
                <button type="submit" className="button primary" disabled={sending || preparingPhoto || !configured}>
                  {sending ? <LoaderCircle className="spin" /> : <Send />} {sending ? "Sharing…" : "Post anonymously"}
                </button>
              </div>
            </form>
            <p className="wall-compose-note"><ShieldCheck /> Up to five photos are resized and stripped of hidden location metadata before upload.</p>
          </section>
        </div>
      ) : null}

      {reporting ? <div className="wall-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReporting(null); }}><section className="wall-dialog" role="dialog" aria-modal="true" aria-labelledby="wall-report-title"><button className="wall-dialog-close" type="button" onClick={() => setReporting(null)} aria-label="Close"><X /></button><span className="wall-dialog-icon"><Flag /></span><h2 id="wall-report-title">Report this post?</h2><p>Your report stays private. Choose the closest reason so it can be reviewed properly.</p><label><span>Reason</span><select value={reportReason} onChange={(event) => setReportReason(event.target.value as WallReportReason)}>{reportReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select></label><div className="wall-dialog-actions"><button type="button" className="button outline" onClick={() => setReporting(null)}>Cancel</button><button type="button" className="button primary" disabled={sending} onClick={() => void submitReport()}>{sending ? <LoaderCircle className="spin" /> : <Flag />} Report privately</button></div></section></div> : null}

      {pendingDelete ? <div className="wall-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null); }}><section className="wall-dialog" role="alertdialog" aria-modal="true" aria-labelledby="wall-delete-title"><button className="wall-dialog-close" type="button" onClick={() => setPendingDelete(null)} aria-label="Close"><X /></button><span className="wall-dialog-icon danger"><Trash2 /></span><h2 id="wall-delete-title">Remove your post?</h2><p>The story, its photos, and its reactions will be permanently deleted.</p><div className="wall-dialog-actions"><button type="button" className="button outline" onClick={() => setPendingDelete(null)}>Keep it</button><button type="button" className="button danger" disabled={sending} onClick={() => void deletePost()}>{sending ? <LoaderCircle className="spin" /> : <Trash2 />} Delete post</button></div></section></div> : null}
    </div>
  );
}
