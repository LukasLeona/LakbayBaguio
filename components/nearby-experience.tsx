"use client";

import Link from "next/link";
import { Clock3, LocateFixed, LockKeyhole, MapPin, MessageCircle, Navigation, Radio, ShieldCheck, Users, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NearbyMap, type MapTraveler } from "./nearby-map";
import { TravelerAvatar } from "./traveler-avatar";
import { ensureAnonymousIdentity, getSupabaseBrowserClient, isCommunityConfigured } from "@/lib/supabase/client";
import { UnreadBadge } from "./chat-notifications";
import { TurnstileWidget, turnstileEnabled } from "./turnstile-widget";

type Traveler = MapTraveler & { distance_band: string; last_seen: string };

const previewTravelers: Traveler[] = [
  { user_id: "preview-1", alias: "MistyHiker27", avatar_seed: 1, distance_band: "Less than 500 m", last_seen: new Date().toISOString(), display_latitude: 16.414, display_longitude: 120.594 },
  { user_id: "preview-2", alias: "PineRobin08", avatar_seed: 5, distance_band: "0.5–1.5 km", last_seen: new Date().toISOString(), display_latitude: 16.421, display_longitude: 120.605 },
  { user_id: "preview-3", alias: "CozyTaho54", avatar_seed: 2, distance_band: "1.5–3 km", last_seen: new Date().toISOString(), display_latitude: 16.405, display_longitude: 120.608 },
  { user_id: "preview-4", alias: "CloudFox19", avatar_seed: 7, distance_band: "3–5 km", last_seen: new Date().toISOString(), display_latitude: 16.428, display_longitude: 120.585 },
];

const BAGUIO_CENTER = { lat: 16.4023, lng: 120.596 };

function distanceFromBaguioMeters(location: { lat: number; lng: number }) {
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(location.lat - BAGUIO_CENTER.lat);
  const longitudeDelta = radians(location.lng - BAGUIO_CENTER.lng);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(BAGUIO_CENTER.lat)) * Math.cos(radians(location.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function NearbyExperience() {
  const configured = isCommunityConfigured();
  const router = useRouter();
  const [travelers, setTravelers] = useState<Traveler[]>(configured ? [] : previewTravelers);
  const [ownLocation, setOwnLocation] = useState<{ lat: number; lng: number } | null>(configured ? null : { lat: 16.4117, lng: 120.598 });
  const [alias, setAlias] = useState(configured ? "Anonymous traveler" : "PreviewPine31");
  const [visible, setVisible] = useState(!configured);
  const [duration, setDuration] = useState(30);
  const [expiresAt, setExpiresAt] = useState<number | null>(configured ? null : Date.now() + 30 * 60_000);
  const [status, setStatus] = useState(configured ? "Share your location to find travelers around you." : "Preview mode — connect Supabase to go live.");
  const [busy, setBusy] = useState(false);
  const [openingChat, setOpeningChat] = useState("");
  const [outsideBaguio, setOutsideBaguio] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [needsCaptcha, setNeedsCaptcha] = useState(false);

  const refreshTravelers = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.rpc("nearby_profiles", { p_radius_meters: 5000 });
    if (error) throw error;
    setTravelers((data || []) as Traveler[]);
  }, []);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const initialize = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      try {
        const { data: authData } = await client.auth.getUser();
        if (!authData.user && turnstileEnabled) {
          if (!cancelled) setNeedsCaptcha(true);
          return;
        }
        const identity = await ensureAnonymousIdentity(client);
        if (!cancelled) setAlias(identity.alias);
      } catch {
        if (!cancelled) setStatus("Community sign-in is unavailable. Check the Supabase setup.");
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [configured]);

  useEffect(() => {
    if (!configured || !visible || !ownLocation) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const heartbeat = window.setInterval(() => {
      void client.rpc("upsert_presence", { p_latitude: ownLocation.lat, p_longitude: ownLocation.lng, p_discoverable: true }).then(() => refreshTravelers());
    }, 45_000);
    return () => window.clearInterval(heartbeat);
  }, [configured, ownLocation, refreshTravelers, visible]);

  useEffect(() => {
    if (!configured || !expiresAt || !visible) return;
    const remaining = expiresAt - Date.now();
    const timeout = window.setTimeout(() => void goOffline(), Math.max(0, remaining));
    return () => window.clearTimeout(timeout);
    // goOffline intentionally reads the latest state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, expiresAt, visible]);

  async function goVisible() {
    if (!configured) {
      setVisible(true);
      setTravelers(previewTravelers);
      setOwnLocation({ lat: 16.4117, lng: 120.598 });
      setExpiresAt(Date.now() + duration * 60_000);
      setStatus("Preview mode — connect Supabase to go live.");
      return;
    }
    if (!navigator.geolocation) { setStatus("Location is not supported by this browser."); return; }
    if (needsCaptcha && !captchaToken) {
      setStatus("Complete the quick security check before turning on radar.");
      return;
    }
    setBusy(true);
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };
      if (distanceFromBaguioMeters(location) > 15_000) {
        setOutsideBaguio(true);
        setStatus("Nearby is available only while you’re in Baguio City.");
        setBusy(false);
        return;
      }
      try {
        const client = getSupabaseBrowserClient();
        if (!client) return;
        const identity = await ensureAnonymousIdentity(client, captchaToken || undefined);
        setAlias(identity.alias);
        setNeedsCaptcha(false);
        const { error } = await client.rpc("upsert_presence", { p_latitude: location.lat, p_longitude: location.lng, p_discoverable: true });
        if (error) throw error;
        setOwnLocation(location);
        setVisible(true);
        setExpiresAt(Date.now() + duration * 60_000);
        setStatus("You’re discoverable. Others only see an approximate map area.");
        await refreshTravelers();
      } catch {
        setStatus("We couldn’t start Nearby. Check the community setup and try again.");
      } finally { setBusy(false); }
    }, () => { setStatus("Location permission is needed to find people nearby."); setBusy(false); }, { enableHighAccuracy: false, timeout: 12_000, maximumAge: 30_000 });
  }

  async function goOffline() {
    if (configured) await getSupabaseBrowserClient()?.rpc("set_presence_offline");
    setVisible(false);
    setOwnLocation(null);
    setTravelers([]);
    setExpiresAt(null);
    setStatus("You’re offline and no longer discoverable.");
  }

  async function startChat(userId: string) {
    if (!configured) {
      const previewId = userId === "preview-1" ? "preview-conversation" : `preview-conversation-${userId.replace("preview-", "")}`;
      router.push(`/chat?tab=messages&conversation=${encodeURIComponent(previewId)}`);
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setOpeningChat(userId);
    const { data, error } = await client.rpc("start_direct_conversation", { p_target_user_id: userId });
    if (error) {
      setOpeningChat("");
      setStatus(error.message);
      return;
    }
    router.push(`/chat?tab=messages&conversation=${encodeURIComponent(String(data))}`);
  }

  const remainingLabel = useMemo(() => expiresAt ? `${Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000))} min` : "Off", [expiresAt]);

  return (
    <div className="nearby-layout">
      <section className="nearby-map-card">
        <NearbyMap travelers={travelers} ownLocation={ownLocation} />
        <div className="map-topbar"><span className={`live-pill ${visible ? "on" : ""}`}><i /> {visible ? `${travelers.length + 1} online nearby` : "Discovery off"}</span><span className="privacy-pill"><LockKeyhole size={13} /> Approximate locations</span></div>
        <div className="map-legend"><span><i className="you" /> You</span><span><i className="traveler" /> Traveler area</span></div>
      </section>

      <aside className="nearby-panel">
        <header className="nearby-profile"><TravelerAvatar alias={alias} seed={3} size="large" /><div><span>Your anonymous name</span><strong>{alias}</strong></div><Link href="/chat?tab=messages" aria-label="Open messages"><MessageCircle /><UnreadBadge className="nearby-unread-badge" /></Link></header>

        <div className="visibility-card">
          <div className="visibility-heading"><div className="radar-icon"><Radio /></div><div><strong>{visible ? "Radar is active" : "Turn on traveler radar"}</strong><span>{status}</span></div></div>
          {!visible ? (
            <>
              <label className="duration-field"><Clock3 size={16} /><span>Stay visible for</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option></select></label>
              {needsCaptcha ? <TurnstileWidget action="nearby_radar" onToken={setCaptchaToken} /> : null}
              <button type="button" className="button primary full" onClick={goVisible} disabled={busy || (needsCaptcha && !captchaToken)}><LocateFixed size={18} /> {busy ? "Locating…" : "Find people nearby"}</button>
            </>
          ) : (
            <div className="active-controls"><span><Clock3 size={15} /> Visible for {remainingLabel}</span><button type="button" onClick={() => void goOffline()}>{configured ? "Go offline" : "Hide preview"}</button></div>
          )}
        </div>

        <div className="traveler-list-heading"><div><h2>Travelers around you</h2><p>Within roughly 5 km</p></div><Navigation size={20} /></div>
        {!visible ? <div className="nearby-empty"><WifiOff /><strong>You’re not discoverable</strong><p>Turn on radar to view and chat with nearby travelers.</p></div> : travelers.length ? (
          <div className="traveler-list">
            {travelers.map((traveler) => {
              const isOpening = openingChat === traveler.user_id;
              return <article key={traveler.user_id}><div className="avatar-wrap"><TravelerAvatar alias={traveler.alias} seed={traveler.avatar_seed} /><i /></div><div className="traveler-copy"><strong>{traveler.alias}</strong><span><MapPin size={13} /> {traveler.distance_band}</span></div><button type="button" onClick={() => void startChat(traveler.user_id)} disabled={Boolean(openingChat)}><MessageCircle size={17} /><span>{isOpening ? "Opening…" : "Chat"}</span></button></article>;
            })}
          </div>
        ) : <div className="nearby-empty"><Users /><strong>No one nearby yet</strong><p>Keep radar on and check again in a moment.</p></div>}

        <div className="safety-note"><ShieldCheck /><p><strong>Privacy by design</strong>Exact coordinates stay protected. Other people receive only a coarse, time-limited map area.</p></div>
      </aside>

      {outsideBaguio ? <div className="location-gate-backdrop" role="presentation"><section className="location-gate-modal" role="dialog" aria-modal="true" aria-labelledby="location-gate-title"><button type="button" onClick={() => setOutsideBaguio(false)} aria-label="Close"><X /></button><span><MapPin /></span><small>Traveler radar</small><h2 id="location-gate-title">Save this for Baguio.</h2><p>Nearby is only available while you’re in Baguio City. We’ll keep your location private and won’t turn on the radar here.</p><button className="button primary full" type="button" onClick={() => setOutsideBaguio(false)}>Got it</button></section></div> : null}
    </div>
  );
}
