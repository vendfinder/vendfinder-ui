# Chat Authentication Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken chat functionality where users cannot contact vendors from product pages due to authentication state mismatch issues.

**Architecture:** Consolidate authentication token management through AuthContext, eliminate direct localStorage access, and implement proper error handling and retry logic across all chat-related components.

**Tech Stack:** React, Next.js, Zustand, Socket.IO, TypeScript

---

## Root Cause Analysis

**Primary Issue:** Authentication state fragmentation causing 401 errors when creating conversations.

**Current broken flow:**
1. User clicks "Contact Vendor" → routes to `/dashboard/messages?product=123&seller=456`
2. Messages page reads token from localStorage directly
3. AuthContext manages token separately, clears invalid tokens
4. Race condition: stale token used in API calls → 401 error
5. User cannot initiate chat conversations

**Additional Issues:**
- RouterErrorBoundary clearing auth localStorage keys
- WebSocket connections failing on token expiry  
- Inconsistent token handling across components
- No proper error handling for auth failures

## Architecture Changes

### Authentication Flow Consolidation
- Single source of truth for authentication through AuthContext
- All components use reactive auth hooks instead of direct localStorage access
- Proactive token validation before API calls
- Automatic retry logic for 401 responses

### Component Integration
- Messages page subscribes to AuthContext token changes
- Chat store methods get tokens from AuthContext
- Socket connections react to auth state changes
- Error boundaries handle authentication failures gracefully

## Implementation Plan

### Task 1: Enhance AuthContext with Token Hook

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Create: `src/hooks/useAuthToken.ts`

- [ ] **Step 1: Add useAuthToken hook to AuthContext**

```typescript
// Add to AuthContext.tsx
const useAuthToken = () => {
  const { token, isAuthenticated } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  
  const validateToken = useCallback(async () => {
    if (!token) return false;
    setIsValidating(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [token]);
  
  return { token, isAuthenticated, validateToken, isValidating };
};

export { useAuthToken };
```

- [ ] **Step 2: Export useAuthToken from AuthContext**

Add export to bottom of AuthContext.tsx file.

- [ ] **Step 3: Add token change event emission**

Add useEffect in AuthProvider to emit events when token changes.

- [ ] **Step 4: Test AuthContext changes**

Run: `npm run dev` and verify AuthContext exports work correctly.

- [ ] **Step 5: Commit AuthContext enhancements**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add useAuthToken hook with validation to AuthContext"
```

### Task 2: Fix Messages Page Authentication

**Files:**
- Modify: `src/app/dashboard/messages/page.tsx:54-57`

- [ ] **Step 1: Replace direct localStorage token access**

Replace lines 54-57:
```typescript
// Remove this:
const token = typeof window !== 'undefined' ? localStorage.getItem('vendfinder-token') : null;

// Replace with:
const { token, isAuthenticated, validateToken, isValidating } = useAuthToken();
```

- [ ] **Step 2: Add loading state for authentication**

```typescript
// Add after token declaration
if (isValidating) {
  return <div>Validating authentication...</div>;
}

if (!isAuthenticated || !token) {
  return <div>Please log in to access messages.</div>;
}
```

- [ ] **Step 3: Update useSocket call**

Change line 65:
```typescript
const { /* socket methods */ } = useSocket(isAuthenticated ? token : null);
```

- [ ] **Step 4: Add error handling for conversation creation**

Wrap conversation creation in try-catch with retry logic around lines 108-121.

- [ ] **Step 5: Test messages page**

Navigate to `/dashboard/messages` and verify authentication works.

- [ ] **Step 6: Commit messages page fixes**

```bash
git add src/app/dashboard/messages/page.tsx
git commit -m "fix: use AuthContext token instead of localStorage in messages page"
```

### Task 3: Fix Chat Store Authentication

**Files:**
- Modify: `src/stores/chat.ts`

- [ ] **Step 1: Remove token parameters from store methods**

Update method signatures to remove token parameters:
```typescript
// Change from:
fetchConversations: (token: string) => Promise<void>;
// To:
fetchConversations: () => Promise<void>;
```

- [ ] **Step 2: Add AuthContext import and usage**

```typescript
import { useAuth } from '@/context/AuthContext';

// In each method, get token from auth:
const { token } = useAuth();
if (!token) throw new Error('Not authenticated');
```

- [ ] **Step 3: Add retry logic for 401 responses**

Wrap API calls with retry logic that refreshes token on 401.

- [ ] **Step 4: Update all chat store method calls**

Remove token parameters from all useChatStore calls throughout the app.

- [ ] **Step 5: Test chat store changes**

Verify chat functionality works with updated store methods.

- [ ] **Step 6: Commit chat store fixes**

```bash
git add src/stores/chat.ts
git commit -m "fix: remove token parameters and use AuthContext in chat store"
```

### Task 4: Fix ChatInitializer Component

**Files:**
- Modify: `src/components/chat/ChatInitializer.tsx:12-16`

- [ ] **Step 1: Replace localStorage token access**

Replace lines 12-16:
```typescript
// Remove:
const token = typeof window !== 'undefined' ? localStorage.getItem('vendfinder-token') : null;

// Add:
const { token } = useAuthToken();
```

- [ ] **Step 2: Update useSocket initialization**

Line 19: Ensure useSocket uses AuthContext token.

- [ ] **Step 3: Update fetchConversations call**

Line 24: Remove token parameter since store now gets it from AuthContext.

- [ ] **Step 4: Test ChatInitializer**

Verify chat initialization works correctly.

- [ ] **Step 5: Commit ChatInitializer fixes**

```bash
git add src/components/chat/ChatInitializer.tsx
git commit -m "fix: use AuthContext token in ChatInitializer"
```

### Task 5: Fix RouterErrorBoundary localStorage Clearing

**Files:**
- Modify: `src/components/RouterErrorBoundary.tsx:40-45`

- [ ] **Step 1: Preserve auth tokens in localStorage clearing**

Modify lines 40-45:
```typescript
keys.forEach((key) => {
  // Only clear Next.js router keys, preserve auth data
  if (key.includes('next-router') && !key.includes('vendfinder-token') && !key.includes('vendfinder-user')) {
    localStorage.removeItem(key);
  }
});
```

- [ ] **Step 2: Test RouterErrorBoundary**

Verify router errors don't clear authentication data.

- [ ] **Step 3: Commit RouterErrorBoundary fix**

```bash
git add src/components/RouterErrorBoundary.tsx
git commit -m "fix: preserve auth tokens when clearing router state"
```

### Task 6: Fix useSocket Token Reactivity

**Files:**
- Modify: `src/hooks/useSocket.ts:11,177`

- [ ] **Step 1: Make socket reactive to token changes**

Ensure useEffect dependency array includes token and properly handles token changes.

- [ ] **Step 2: Add auto-reconnect on token refresh**

Add logic to reconnect socket when token is refreshed.

- [ ] **Step 3: Test socket connection**

Verify WebSocket connects and handles auth failures gracefully.

- [ ] **Step 4: Commit socket fixes**

```bash
git add src/hooks/useSocket.ts
git commit -m "fix: make socket connection reactive to auth token changes"
```

### Task 7: Add Error Handling and User Feedback

**Files:**
- Modify: `src/app/products/[slug]/ProductDetailClient.tsx`
- Modify: `src/components/chat/MessageInput.tsx`

- [ ] **Step 1: Add error states for failed conversation creation**

Add toast notifications or error messages when "Contact Vendor" fails.

- [ ] **Step 2: Add loading states during conversation creation**

Show loading indicator while conversation is being created.

- [ ] **Step 3: Add retry buttons for failed operations**

Allow users to retry failed conversation creation.

- [ ] **Step 4: Test error handling**

Test various failure scenarios and verify proper user feedback.

- [ ] **Step 5: Commit error handling improvements**

```bash
git add src/app/products/[slug]/ProductDetailClient.tsx src/components/chat/MessageInput.tsx
git commit -m "feat: add error handling and user feedback for chat operations"
```

### Task 8: Integration Testing

**Files:**
- Test: Complete user flow from product page to chat

- [ ] **Step 1: Test "Contact Vendor" flow**

Navigate from product page → click "Contact Vendor" → verify chat opens.

- [ ] **Step 2: Test authentication scenarios**

Test with valid token, expired token, and no token scenarios.

- [ ] **Step 3: Test WebSocket connectivity**

Verify real-time messaging works after fixes.

- [ ] **Step 4: Test error recovery**

Verify graceful handling of auth failures and recovery.

- [ ] **Step 5: Document test results**

Create test report confirming all scenarios work.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "test: verify chat authentication fixes work end-to-end"
```

## Success Criteria

✅ Users can click "Contact Vendor" and successfully create conversations  
✅ No 401 authentication errors in chat functionality  
✅ WebSocket connections remain stable across auth state changes  
✅ Proper error messages shown for auth failures  
✅ All components use consistent authentication state  
✅ Router errors don't break authentication  

## Testing Strategy

1. **Unit Tests**: Test AuthContext hooks and token validation
2. **Integration Tests**: Test complete "Contact Vendor" flow  
3. **Error Scenarios**: Test expired tokens, network failures
4. **WebSocket Tests**: Test real-time messaging with auth changes