"use client";

import { Check, Copy, Link2, LoaderCircle, QrCode, Share2, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import type { PlannedItinerary } from "@/lib/planner-engine";
import { sharedItineraryPath } from "@/lib/shared-itinerary";

type ShareStage = "loading" | "security" | "ready" | "error";

export function ItineraryShareDialog({ itinerary, open, onClose }: { itinerary: PlannedItinerary; open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<ShareStage>("loading");
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [error, setError] = useState("");

  const createShare = useCallback(async () => {
    setStage("loading");
    setError("");
    try {
      const response = await fetch("/api/itineraries/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary }),
      });
      const result = await response.json() as { token?: string; error?: string };
      if (!response.ok || typeof result.token !== "string") throw new Error(result.error || "The share link could not be created.");
      const url = `${window.location.origin}${sharedItineraryPath(result.token)}`;
      const qr = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#082c22", light: "#fffdf5" },
      });
      setShareUrl(url);
      setQrDataUrl(qr);
      setStage("ready");
    } catch (shareError) {
      const message = shareError instanceof Error ? shareError.message : "The share link could not be created.";
      setError(message);
      setStage("error");
    }
  }, [itinerary]);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open || shareUrl) return;
    setStage("security");
    setError("");
  }, [open, shareUrl]);

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
            <h3>Your private link is ready to create</h3>
            <p>One tap packages this itinerary into a read-only link that remains available for 90 days.</p>
            <button className="button primary full" type="button" onClick={() => void createShare()}><Link2 /> Generate my link</button>
            <small className="share-security-note"><ShieldCheck /> Protected by private hourly sharing limits</small>
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
          <div className="share-dialog-error"><span>Link unavailable</span><h3>We couldn’t prepare this share yet.</h3><p>{error}</p><button className="button primary" type="button" onClick={() => void createShare()}>Try again</button></div>
        ) : null}
      </section>
    </div>
  );
}
