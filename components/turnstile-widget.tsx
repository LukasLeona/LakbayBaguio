"use client";

import Script from "next/script";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileOptions = {
  sitekey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  size?: "normal" | "compact" | "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      execute: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export type TurnstileWidgetHandle = {
  execute: () => void;
};

type TurnstileWidgetProps = {
  action: string;
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  label?: string | null;
  onError?: () => void;
  onToken: (token: string) => void;
};

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget({
  action,
  appearance = "interaction-only",
  execution = "render",
  label = "Protected by Cloudflare Turnstile.",
  onError,
  onToken,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingExecutionRef = useRef(false);

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!container || !sitekey || !window.turnstile || widgetIdRef.current) return;
    const widgetId = window.turnstile.render(container, {
      sitekey,
      action,
      appearance,
      execution,
      size: "flexible",
      callback: (token) => {
        pendingExecutionRef.current = false;
        onToken(token);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        pendingExecutionRef.current = false;
        onToken("");
        onError?.();
      },
    });
    widgetIdRef.current = widgetId;
    if (pendingExecutionRef.current) window.turnstile.execute(widgetId);
  }, [action, appearance, execution, onError, onToken]);

  useImperativeHandle(ref, () => ({
    execute() {
      pendingExecutionRef.current = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.execute(widgetIdRef.current);
        return;
      }
      renderWidget();
    },
  }), [renderWidget]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  if (!turnstileEnabled) return null;

  return (
    <div className="turnstile-field">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} />
      {label ? <small>{label}</small> : null}
    </div>
  );
});
