"use client";

import { Check, Copy, Link2, LoaderCircle, QrCode, Share2, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlannedItinerary } from "@/lib/planner-engine";
import { sharedItineraryPath } from "@/lib/shared-itinerary";
import { ensureAnonymousIdentity, getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TurnstileWidget, turnstileEnabled, type TurnstileWidgetHandle } from "./turnstile-widget";

type ShareStage = "loading" | "security" | "ready" | "error";
type SecurityState = "idle" | "checking" | "failed";

export function ItineraryShareDialog({ itinerary, open, onClose }: { itinerary: PlannedItinerary; open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<ShareStage>("loading");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [error, setError] = useState("");
  const [securityState, setSecurityState] = useState<SecurityState>("idle");
  const securityRef = useRef<TurnstileWidgetHandle>(null);
  const securityTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const clearSecurityTimeout = useCallback(() => {
    if (securityTimeoutRef.current === null) return;
    window.clearTimeout(securityTimeoutRef.current);
    securityTimeoutRef.current = null;
  }, []);

  const createShare = useCallback(async (captchaToken?: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Sharing is not configured yet. Please try again later.");
      setStage("error");
      return;
    }
    setStage("loading");
    setError("");
    try {
      await ensureAnonymousIdentity(client, captchaToken);
      const { data, error: shareError } = await client.rpc("create_shared_itinerary", { p_itinerary: itinerary });
      if (shareError) throw shareError;
      if (typeof data !== "string") throw new Error("The share link could not be created.");
      const url = `${window.location.origin}${sharedItineraryPath(data)}`;
      const qr = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#082c22", light: "#fffdf5" },
      });
      setShareUrl(url);
      setQrDataUrl(qr);
      setStage("ready");
      setSecurityState("idle");
      setTurnstileToken("");
    } catch (shareError) {
      const message = shareError instanceof Error ? shareError.message : "The share link could not be created.";
      if (turnstileEnabled && message.toLowerCase().includes("captcha")) {
        setTurnstileToken("");
        setSecurityState("failed");
        setError("The security check expired or could not be completed. Please tap below to try again.");
        setStage("security");
        return;
      }
      setError(message.includes("Share limit reached") ? "You’ve created several links this hour. Please try again a little later." : message);
      setStage("error");
    }
  }, [itinerary]);

  const handleSecurityError = useCallback(() => {
    clearSecurityTimeout();
    setTurnstileToken("");
    setSecurityState("failed");
    setError("The security check could not load. Check your connection, then try again.");
  }, [clearSecurityTimeout]);

  const handleSecurityToken = useCallback((token: string) => {
    setTurnstileToken(token);
    if (!token) return;
    clearSecurityTimeout();
    setSecurityState("checking");
    void createShare(token);
  }, [clearSecurityTimeout, createShare]);

  const beginSecurityCheck = useCallback(() => {
    clearSecurityTimeout();
    setError("");
    setTurnstileToken("");
    setSecurityState("checking");
    securityRef.current?.reset();
    securityRef.current?.execute();
    securityTimeoutRef.current = window.setTimeout(() => {
      setSecurityState("failed");
      setError("The security check is taking longer than expected. Please tap below to try again.");
    }, 12000);
  }, [clearSecurityTimeout]);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open || shareUrl) return;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Sharing is not configured yet. Please try again later.");
      setStage("error");
      return;
    }
    let cancelled = false;
    void client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session || !turnstileEnabled) void createShare();
      else {
        setStage("security");
        setSecurityState("idle");
      }
    });
    return () => { cancelled = true; };
  }, [createShare, open, shareUrl]);

  useEffect(() => () => clearSecurityTimeout(), [clearSecurityTimeout]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (!shareUrl || !navigator.share) return;
    try {
      await navigator.share({ title: itinerary.title, text: "Here’s a Baguio itinerary shared with you.", url: shareUrl });
    } catch {
      // Closing the device share sheet is not an error the traveler needs to see.
    }
  }

  if (!open) return null;

  return (
    <div className="share-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
        <button className="share-dialog-close" type="button" onClick={onClose} aria-label="Close sharing"><X /></button>
        <header>
          <span><Share2 /></span>
          <small>Pass the trip along</small>
          <h2 id="share-dialog-title">Share this itinerary</h2>
          <p>Anyone with the private link can view this read-only route for 90 days.</p>
        </header>

        {stage === "loading" ? (
          <div className="share-dialog-loading" role="status"><LoaderCircle className="spin" /><strong>Preparing your private link…</strong><span>Packaging the route and drawing its QR code.</span></div>
        ) : null}

        {stage === "security" ? (
          <div className="share-dialog-security">
            <ShieldCheck />
            <h3>One quick security check</h3>
            <p>Tap once to verify you’re a real traveler. Your private itinerary link will be created automatically.</p>
            <TurnstileWidget
              ref={securityRef}
              action="share_itinerary"
              appearance="interaction-only"
              execution="execute"
              label={null}
              onToken={handleSecurityToken}
              onError={handleSecurityError}
            />
            {securityState === "failed" ? <p className="share-security-error" role="alert">{error}</p> : null}
            <button className="button primary full" type="button" disabled={securityState === "checking"} onClick={beginSecurityCheck}>
              {securityState === "checking" ? <><LoaderCircle className="spin" /> Verifying…</> : <><Link2 /> {securityState === "failed" ? "Retry security check" : "Verify & generate link"}</>}
            </button>
            <small className="share-security-note"><ShieldCheck /> Protected by Cloudflare Turnstile</small>
          </div>
        ) : null}

        {stage === "ready" ? (
          <div className="share-dialog-ready">
            <div className="share-qr"><img src={qrDataUrl} alt="QR code for the shared itinerary" /><span><QrCode /> Scan to open the route</span></div>
            <div className="share-link-block">
              <label htmlFor="shared-itinerary-link">Shareable link</label>
              <div><input id="shared-itinerary-link" value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} /><button type="button" onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />}<span>{copied ? "Copied" : "Copy"}</span></button></div>
              <p><ShieldCheck /> Read-only · No traveler identity included · Expires in 90 days</p>
            </div>
            <div className="share-dialog-actions">
              {canNativeShare ? <button className="button primary" type="button" onClick={() => void nativeShare()}><Share2 /> Share from device</button> : null}
              <button className="button secondary" type="button" onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />} {copied ? "Link copied" : "Copy link"}</button>
            </div>
          </div>
        ) : null}

        {stage === "error" ? (
          <div className="share-dialog-error"><span>Link unavailable</span><h3>We couldn’t prepare this share yet.</h3><p>{error}</p><button className="button primary" type="button" onClick={() => { if (turnstileEnabled && !turnstileToken) { setStage("security"); setSecurityState("idle"); setError(""); } else void createShare(turnstileToken || undefined); }}>Try again</button></div>
        ) : null}
      </section>
    </div>
  );
}
