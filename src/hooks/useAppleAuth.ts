"use client";

import { useEffect, useCallback, useRef } from "react";

const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

declare global {
  interface AppleSignInAPI {
    auth: {
      init: (config: {
        clientId: string;
        scope: string;
        redirectURI: string;
        usePopup: boolean;
      }) => void;
      signIn: () => Promise<{
        authorization: {
          id_token: string;
          code: string;
        };
        user?: {
          name?: { firstName?: string; lastName?: string };
          email?: string;
        };
      }>;
    };
  }
  interface Window {
    AppleID?: AppleSignInAPI;
  }
}

export function useAppleAuth(
  onSuccess: (token: string, name?: string) => void,
  onError?: (error: string) => void
) {
  const callbackRef = useRef(onSuccess);
  const errorRef = useRef(onError);

  useEffect(() => {
    callbackRef.current = onSuccess;
    errorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!APPLE_CLIENT_ID) return;

    // Load Apple Sign In JS SDK
    if (document.getElementById("apple-signin-script")) return;

    const script = document.createElement("script");
    script.id = "apple-signin-script";
    script.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.AppleID?.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: window.location.origin,
        usePopup: true,
      });
    };
    document.head.appendChild(script);
  }, []);

  const triggerAppleLogin = useCallback(async () => {
    if (!APPLE_CLIENT_ID) {
      errorRef.current?.("Apple sign-in is not configured");
      return;
    }
    if (!window.AppleID) {
      errorRef.current?.("Apple SDK not loaded yet. Please try again.");
      return;
    }

    try {
      const response = await window.AppleID.auth.signIn();
      const token = response.authorization.id_token;

      // Apple only sends name on first authorization
      let name: string | undefined;
      if (response.user?.name) {
        const { firstName, lastName } = response.user.name;
        name = [firstName, lastName].filter(Boolean).join(" ");
      }

      callbackRef.current(token, name);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Apple sign-in was cancelled";
      errorRef.current?.(message);
    }
  }, []);

  return { triggerAppleLogin, isConfigured: !!APPLE_CLIENT_ID };
}
