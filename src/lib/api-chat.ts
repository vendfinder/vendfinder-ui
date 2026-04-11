import { Conversation, ChatMessage } from "@/types";

// Cache for user info to avoid redundant fetches within the same session
const userCache = new Map<string, { name: string; username: string; avatar?: string }>();

async function fetchUserInfo(userId: string, token: string): Promise<{ name: string; username: string; avatar?: string }> {
  if (userCache.has(userId)) return userCache.get(userId)!;
  try {
    const res = await fetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const user = await res.json();
      const info = {
        name: user.displayName || user.name || user.username || "User",
        username: user.username || "user",
        avatar: user.avatarUrl || user.avatar_url || undefined,
      };
      userCache.set(userId, info);
      return info;
    }
  } catch { /* ignore */ }
  return { name: "User", username: "user" };
}

async function fetchProductInfo(productId: string): Promise<{ id: string; name: string; image: string; price: number } | null> {
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (res.ok) {
      const p = await res.json();
      // Handle both raw ApiProduct format and transformed Product format
      const image = p.media?.[0]?.url || p.image_url || p.images?.[0] || "";
      const price = parseFloat(p.current_lowest_ask) || parseFloat(p.retail_price) || p.price || 0;
      return { id: productId, name: p.name || "", image, price };
    }
  } catch { /* ignore */ }
  return null;
}

export async function fetchConversations(
  token: string
): Promise<Conversation[]> {
  const res = await fetch("/api/chat/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  const raw = await res.json();

  const items = Array.isArray(raw) ? raw : [];

  // Transform chat-service DB format to frontend Conversation type
  return Promise.all(
    items.map(async (c: Record<string, unknown>) => {
      // If already has participants array with full info, pass through
      if (Array.isArray(c.participants) && c.participants[0]?.avatar !== undefined) {
        return c as unknown as Conversation;
      }

      const p1Id = (c.participant1_id as string) || "";
      const p2Id = (c.participant2_id as string) || "";
      const p1NameRaw = c.participant1Name;
      const p2NameRaw = c.participant2Name;
      const lastMsg = c.last_message as Record<string, string> | null;

      // Fetch full user info for both participants (name, avatar, username)
      const fallback = (raw: unknown) => ({ name: typeof raw === "string" ? raw : "User", username: "user", avatar: undefined as string | undefined });
      const [p1Info, p2Info] = await Promise.all([
        p1Id ? fetchUserInfo(p1Id, token) : Promise.resolve(fallback(p1NameRaw)),
        p2Id ? fetchUserInfo(p2Id, token) : Promise.resolve(fallback(p2NameRaw)),
      ]);

      // Fetch product info if conversation has a product_id but no product details
      let product: Conversation["product"] = undefined;
      if (c.product_id) {
        if (c.product_name) {
          product = {
            id: c.product_id as string,
            name: (c.product_name as string) || "",
            image: (c.product_image as string) || "",
            price: Number(c.product_price) || 0,
          };
        } else {
          const fetched = await fetchProductInfo(c.product_id as string);
          if (fetched) product = fetched;
        }
      }

      return {
        id: c.id as string,
        type: (c.type as Conversation["type"]) || undefined,
        participants: [
          { id: p1Id, name: p1Info.name, username: p1Info.username, avatar: p1Info.avatar },
          { id: p2Id, name: p2Info.name, username: p2Info.username, avatar: p2Info.avatar },
        ],
        product,
        lastMessage: lastMsg
          ? {
              content: (lastMsg.original_text as string) || (lastMsg.content as string) || "",
              senderId: (lastMsg.sender_id as string) || "",
              timestamp: (lastMsg.created_at as string) || "",
            }
          : undefined,
        unreadCount: Number(c.unread_count) || 0,
        updatedAt: (c.updated_at as string) || (c.updatedAt as string) || "",
      } as Conversation;
    })
  );
}

function normalizeMessage(m: Record<string, unknown>): ChatMessage {
  return {
    id: (m.id as string) || "",
    conversationId: (m.conversation_id as string) || (m.conversationId as string) || "",
    senderId: (m.sender_id as string) || (m.senderId as string) || "",
    content: (m.content as string) || (m.body as string) || (m.original_text as string) || "",
    type: (m.type as ChatMessage["type"]) || "text",
    metadata: (m.metadata as ChatMessage["metadata"]) || undefined,
    isEdited: Boolean(m.is_edited || m.isEdited),
    translations: (m.translations as Record<string, string>) || null,
    createdAt: (m.created_at as string) || (m.createdAt as string) || "",
    readAt: (m.read_at as string) || (m.readAt as string) || undefined,
  };
}

export async function fetchMessages(
  conversationId: string,
  token: string,
  cursor?: string
): Promise<{ messages: ChatMessage[]; hasMore: boolean; nextCursor: string | null }> {
  const url = new URL(`/api/chat/conversations/${conversationId}/messages`, window.location.origin);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  const data = await res.json();

  // Handle both { messages, hasMore, nextCursor } and raw array formats
  if (Array.isArray(data)) {
    return { messages: data.map(normalizeMessage), hasMore: false, nextCursor: null };
  }
  const msgs = Array.isArray(data.messages) ? data.messages : [];
  return {
    messages: msgs.map(normalizeMessage),
    hasMore: data.hasMore || false,
    nextCursor: data.nextCursor || null,
  };
}

export async function sendMessage(
  conversationId: string,
  content: string,
  token: string,
  type?: string,
  senderLocale?: string
): Promise<ChatMessage> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: content, content, type: type || "text", sender_locale: senderLocale }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  const data = await res.json();
  return normalizeMessage(data as Record<string, unknown>);
}

export async function createConversation(
  productId: string | null,
  sellerId: string,
  token: string,
  productInfo?: { name: string; image: string; price: number }
): Promise<{ id: string; existing: boolean }> {
  // Deployed chat-service expects participantId/participantType format
  const body: Record<string, unknown> = {
    participantId: sellerId,
    participantType: "user",
    sellerId, // keep for compatibility with newer chat-service versions
  };
  if (productId) {
    body.productId = productId;
    if (productInfo) {
      body.productName = productInfo.name;
      body.productImage = productInfo.image;
      body.productPrice = productInfo.price;
    }
  }
  const res = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function createOffer(
  conversationId: string,
  price: number,
  token: string,
  expiresInHours?: number
): Promise<{ offer: unknown; message: ChatMessage }> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ price, expiresInHours: expiresInHours || 24 }),
  });
  if (!res.ok) throw new Error("Failed to create offer");
  return res.json();
}

export async function respondToOffer(
  offerId: string,
  action: string,
  token: string,
  counterPrice?: number
): Promise<{ success: boolean; status: string }> {
  const res = await fetch(`/api/chat/offers/${offerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, counterPrice }),
  });
  if (!res.ok) throw new Error("Failed to respond to offer");
  return res.json();
}

export async function markAsRead(
  conversationId: string,
  token: string
): Promise<void> {
  await fetch(`/api/chat/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createSupportConversation(
  token: string,
  message: string,
  category?: string
): Promise<{ id: string; existing: boolean; message: ChatMessage }> {
  const res = await fetch("/api/chat/conversations/support", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, category }),
  });
  if (!res.ok) throw new Error("Failed to create support conversation");
  return res.json();
}

export async function reportMessage(
  messageId: string,
  reason: string,
  token: string,
  details?: string
): Promise<void> {
  const res = await fetch(`/api/chat/messages/${messageId}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason, details }),
  });
  if (!res.ok) throw new Error("Failed to report message");
}
