# API Communication & Performance Analysis

This document outlines the current state of API communication in the social network UI, identifies performance bottlenecks, and proposes strategic improvements.

## Current Architecture

### 1. Centralized Axios Configuration (`src/utils/axios.js`)
- **Singleton Instance:** A shared axios instance handles all requests with base URL and timeout configurations.
- **Token Management:** Implements a robust token refresh mechanism with a promise queue to handle concurrent 401 errors.
- **Interceptors:** Automatically attaches Authorization headers and handles global API errors.

### 2. State Management Strategy
- **Zustand (`src/store/ZustandStore.js`):** Used for global synchronization of chats, notifications, and unread counts.
- **Local State:** Newsfeed posts and comments are managed via local `useState` in pages/components.
- **Optimistic UI:** Custom hooks like `usePostAction` and `useComments` provide immediate UI feedback for interactions (likes, edits, deletes) while syncing with the backend.

### 3. Data Fetching Patterns
- **Manual Fetching:** Primarily relies on `useEffect` and event handlers to trigger `api.get/post` calls.
- **Pagination:** Uses `skip` and `limit` parameters for newsfeed and chat history.
- **WebSocket Integration:** Real-time updates for chats and notifications are handled via STOMP/WebSocket, which manually update the Zustand store.

---

## Identified Performance Issues

### 1. Lack of Global Caching Layer
- **Problem:** Navigating between pages (e.g., Home -> Profile -> Home) causes the newsfeed to be re-fetched entirely because its state is local and destroyed on unmount.
- **Impact:** Increased server load, higher data usage, and a "loading flash" on every navigation.

### 2. Client-Side Filtering Waterfall
- **Problem:** `HomePage` fetches posts and then filters them based on privacy and friendship status on the client side.
- **Impact:** Transfers unnecessary data over the wire. If a user has 1000 posts but only 10 are visible to the viewer, the payload is 100x larger than needed.

### 3. State Inconsistency Risk
- **Problem:** Data is scattered between local state and Zustand. For example, a "liked" status updated in a specific `PostCard` might not be reflected if the same post is visible in a different context (like a "Saved Posts" page, if implemented).

### 4. WebSocket Update Overhead
- **Problem:** When a new message arrives, the entire `chatList` in Zustand is mapped and sorted on the client. 
- **Impact:** For users with hundreds of active chats, this could cause frame drops during high-frequency messaging.

### 5. Manual Intersection Observer
- **Problem:** Infinite scroll logic is manually implemented in multiple places (`HomePage`, `useChat`).
- **Impact:** Harder to maintain and potential for subtle bugs in edge cases (e.g., rapid scrolling).

---

## Proposed Improvements

### Phase 1: Infrastructure & Caching
- [x] **Adopt TanStack Query (React Query):** 
    - Installed `@tanstack/react-query`.
    - Implemented `QueryProvider` and wrapped `RootLayout`.
    - Created `useNewsfeed` hook using `useInfiniteQuery`.
- [x] **Centralize Infinite Scroll:**
    - Created a reusable `useInfiniteScroll` hook to abstract away `IntersectionObserver` logic.
- [x] **Refactor HomePage to use TanStack Query**

### Phase 2: API & Data Flow Optimization
- [x] **Move Privacy Filtering to Backend (Redundancy Removal):**
    - Removed redundant client-side privacy filtering in `HomePage` and `ProfilePageClient`.
    - Confirmed that the backend now handles post authorization, simplifying the UI logic and reducing payload processing.
- [x] **Normalize Global State:**
    - Used TanStack Query's cache as the "source of truth" for posts and comments to ensure consistency across the UI. Created `useCommentsQuery`, `useCommentMutation`, and `useUserPosts`. Refactored `PostModal`, `Comment`, and `ProfilePageClient`.
- [x] **Optimize Zustand Updates:**
    - Stored `chatList` as an object/Map keyed by `chatId` (`chatMap`) for O(1) updates.
    - Derived the sorted list using a `selectSortedChatList` selector.
    - Updated references across the application to use the new selector, preventing unnecessary O(N) array mapping during real-time updates.

### Phase 3: Media & Payload Optimization

- [x] **Lazy Load Media Details:**
    - **On-Demand Comment Threads:** Configured main post comments to only be requested from the backend when the user opens the `PostModal` (via TanStack Query).
    - **Optimized Sub-Comments/Replies:** Configured nested replies in `Comment.jsx` to load lazily via `useRepliesQuery`, triggered only when the user explicitly expands the reply section.
    - **Removed Redundant Double-Fetching:** Cleaned up `PostCard.jsx` to remove manual HTTP comment fetches and local state, avoiding double-fetching when `PostModal` mounts.
    - **Responsive Media & Lazy Loading:** Leveraged Next.js `<Image>` component in `ImageView` (with automatic layout-based sizes and lazy rendering) for the main feed, fetching full-resolution unoptimized assets only when rendering the interactive media carousel inside the modal.

## Conclusion

The API performance optimizations are now fully complete across all three phases. Transitioning key sections to TanStack Query, moving privacy filtering to the server, optimizing Zustand selector-based state propagation, and implementing strict on-demand lazy loading for media details and comments has significantly reduced payload sizes, server load, and client-side rendering bottlenecks. These changes ensure long-term stability and high responsiveness for PocPoc.
