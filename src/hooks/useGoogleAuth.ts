"use client";

import { useEffect, useCallback, useRef } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

export function useGoogleAuth(
  onSuccess: (token: string) => void,
  onError?: (error: string) => void
) {
  const callbackRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  callbackRef.current = onSuccess;
  errorRef.current = onError;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load Google Identity Services SDK
    if (document.getElementById("google-gsi-script")) return;

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          callbackRef.current(response.credential);
        },
      });
    };
    document.head.appendChild(script);
  }, []);

  const triggerGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      errorRef.current?.("Google sign-in is not configured");
      return;
    }
    if (!window.google) {
      errorRef.current?.("Google SDK not loaded yet. Please try again.");
      return;
    }
    window.google.accounts.id.prompt();
  }, []);

  return { triggerGoogleLogin, isConfigured: !!GOOGLE_CLIENT_ID };
}
