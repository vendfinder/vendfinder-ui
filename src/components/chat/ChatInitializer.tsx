"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatStore } from "@/stores/chat";
import { useSocket } from "@/hooks/useSocket";

export default function ChatInitializer() {
  const { user, isAuthenticated } = useAuth();
  const { fetchConversations, reset, conversationsLoaded } = useChatStore();

  // Get token from localStorage
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("vendfinder-token")
      : null;

  // Initialize socket connection
  useSocket(isAuthenticated ? token : null);

  // Fetch conversations when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !conversationsLoaded) {
      fetchConversations(token);
    }
  }, [isAuthenticated, token, conversationsLoaded, fetchConversations]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, reset]);

  return null;
}
