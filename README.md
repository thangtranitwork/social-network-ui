# 🌐 PocPoc — Social Network UI

> Frontend web application for the **PocPoc** social network platform, built with **Next.js 15** and **React 18**.

---

## ✨ Features

- 📰 **Newsfeed** — Infinite-scroll post feed with relevance/latest filter
- 💬 **Real-time Chat** — 1-on-1 & group messaging via WebSocket (STOMP)
- 📞 **Voice & Video Calls** — In-app calling powered by Stringee SDK
- 🔔 **Live Notifications** — Socket-driven notification center with unread badge
- 👤 **User Profiles** — Profile header, posts tab, mutual friends, friend request flow
- 🤝 **Friends System** — Friend requests, search, and friend list management
- 🖼️ **Media Support** — Image/video carousel, voice message recording & playback
- 🎞️ **GIF Picker** — Inline GIF search and sending in chat
- 🌙 **Dark / Light Mode** — Theme toggle with `next-themes`
- 🌐 **Internationalisation** — Multi-language support via `next-intl`
- 🛡️ **Admin Dashboard** — User & post management panel
- 📱 **PWA Ready** — Progressive Web App notification manager

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| UI Library | React 18 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| State Management | Zustand (with devtools) |
| HTTP Client | Axios |
| Real-time | STOMP over SockJS |
| Charts | Recharts |
| Voice/Video | Stringee SDK |
| Audio Waveform | WaveSurfer.js |
| Icons | Lucide React |
| Date Utils | Day.js |
| Auth | JWT / js-cookie |
| i18n | next-intl |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login / Register pages
│   ├── (home)/          # Main app layout (auth-gated)
│   │   ├── home/        # Newsfeed page
│   │   ├── chats/       # Chat list + chat box
│   │   ├── friends/     # Friends list & requests
│   │   ├── profile/     # User profile ([username])
│   │   ├── search/      # People / post search
│   │   └── settings/    # Account settings
│   ├── admin/           # Admin dashboard
│   │   └── dashboard/
│   │       ├── users/   # Manage users
│   │       ├── posts/   # Manage posts
│   │       ├── viewusers/
│   │       └── viewposts/
│   └── post/            # Single post page
├── components/
│   ├── social-app-component/   # Feature-level components
│   │   ├── PostCard.jsx
│   │   ├── ChatBox.jsx
│   │   ├── ChatList.jsx
│   │   ├── ProfileHeader.jsx
│   │   ├── NotificationList.jsx
│   │   ├── CallModal.jsx
│   │   └── ...
│   └── ui-components/          # Reusable primitives
│       ├── Avatar.jsx
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Sidebar.jsx
│       ├── MediaCarousel.jsx
│       └── ...
├── hooks/               # Custom React hooks
│   ├── useChat.js
│   ├── useMessageNotification.js
│   ├── useNotificationSocket.js
│   ├── useOnlineNotification.js
│   ├── useTypingNotification.js
│   └── ...
├── store/
│   └── ZustandStore.js  # Global state (chat, notifications, user)
├── context/             # React context providers
├── providers/           # App-level providers
├── utils/               # Axios instance, helpers
└── i18n/                # Locale config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- Backend API running (see [`social-network-go`](../social-network-go))

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd social-network-ui

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:80
NEXT_PUBLIC_STOMP_URL=ws://localhost:80/ws
NEXT_PUBLIC_STRINGEE_TOKEN=<your-stringee-token>
```

> Adjust the URLs to match your backend / API gateway setup.

### Development

```bash
npm run dev
```

App runs on **http://localhost:10000**

### Build & Start (Production)

```bash
npm run build
npm start        # serves on port 10000
```

### Lint

```bash
npm run lint
```

---

## 🔌 API & Real-time

All HTTP requests go through the **API Gateway** at the base URL configured in `.env.local`.

WebSocket connections use **STOMP over SockJS** for:
- Incoming chat messages
- New chat creation events
- Real-time notifications
- Online presence / typing indicators

---

## 🗂️ Key Modules

### Global Store (`ZustandStore.js`)
Centralized Zustand store managing:
- **Chat state** — list, unread counts, selection, online status
- **Notification state** — list, unread badge, socket merging
- **App init** — parallel fetch of chats + notification counts on login

### Custom Hooks
| Hook | Purpose |
|---|---|
| `useChat` | Message pagination, send, socket subscription |
| `useMessageNotification` | Toast notifications for incoming messages |
| `useNotificationSocket` | Subscribe to notification events |
| `useOnlineNotification` | Online/offline presence updates |
| `useTypingNotification` | Show typing indicator in chat |
| `useErrorSocket` | Handle socket error events |

---

## 🛡️ Security Headers

Configured in `next.config.mjs`:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `origin-when-cross-origin` |

---

## 📄 License

Private project — all rights reserved.
