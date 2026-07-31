"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function TurnstileWidget({ siteKey, onSuccess, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const renderWidget = () => {
    if (typeof window !== "undefined" && window.turnstile && containerRef.current && widgetIdRef.current === null) {
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (onSuccess) onSuccess(token);
          },
          "expired-callback": () => {
            if (onExpire) onExpire();
          },
          "error-callback": () => {
            if (onError) onError();
          },
        });
      } catch (e) {
        console.error("Turnstile render error:", e);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.turnstile) {
      renderWidget();
    }

    return () => {
      if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onLoad={renderWidget}
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="cf-turnstile flex justify-center my-3" />
    </>
  );
}
