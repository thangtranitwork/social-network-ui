"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import api from "@/utils/axios";
import { subscribe, sendMessage } from "@/utils/socket";
import toast from "react-hot-toast";
import { createDefaultSpaceNodes, arrangeExistingNodes } from "./spatialConstants";
import SpatialViewport from "./SpatialViewport";
import SpatialFloatingDock from "./SpatialFloatingDock";
import SpatialMinimap from "./SpatialMinimap";
import SpatialBuilderToolbar from "./SpatialBuilderToolbar";
import AddSpatialNodeModal from "./modals/AddSpatialNodeModal";
import SpatialNodeWrapper from "./nodes/SpatialNodeWrapper";
import IdentityCoreNode from "./nodes/IdentityCoreNode";
import PostExhibitNode from "./nodes/PostExhibitNode";
import CommentExhibitNode from "./nodes/CommentExhibitNode";
import EmbedIframeNode from "./nodes/EmbedIframeNode";
import MediaFrameNode from "./nodes/MediaFrameNode";
import TextNoteNode from "./nodes/TextNoteNode";
import AudioVinylNode from "./nodes/AudioVinylNode";
import PortalFriendNode from "./nodes/PortalFriendNode";
import GuestbookWallNode from "./nodes/GuestbookWallNode";

export default function SpatialProfileContainer({
  routeUsername,
  profileData,
  isOwnProfile = false,
  posts = [],
  files = [],
  onProfileUpdate,
  onUsernameChange,
  onToggleLikePost,
  classicFeedContent,
}) {
  const tSpace = useTranslations("profile.space");

  const [viewMode, setViewMode] = useState("SPACE");
  const [isConfigured, setIsConfigured] = useState(false);
  const [theme, setTheme] = useState("COSMIC_VOID");
  const [customAccent, setCustomAccent] = useState("#6366F1");
  const [allowGuestbook, setAllowGuestbook] = useState(true);
  const [autoplayNodeId, setAutoplayNodeId] = useState("");
  const [nodes, setNodes] = useState([]);
  const [guestbookEntries, setGuestbookEntries] = useState([]);

  const [camera, setCamera] = useState({ panX: 0, panY: 0, zoom: 0.92 });
  const [is3DMode, setIs3DMode] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingSpace, setIsSavingSpace] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [visitors, setVisitors] = useState({});
  const [latestReaction, setLatestReaction] = useState(null);
  const [spaceReactions, setSpaceReactions] = useState(null);
  const visitorsList = useMemo(() => Object.values(visitors), [visitors]);
  const lastMyCursorRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    setCurrentUserId(uid);
  }, []);

  // Real-time Spatial Room: Live Visitors Presence & Fireflies Cursors
  useEffect(() => {
    if (!routeUsername) return;

    const storedUsername = localStorage.getItem("userName") || "";
    const storedUserId = localStorage.getItem("userId") || "";
    const currentAvatar = isOwnProfile
      ? profileData?.profilePictureUrl || ""
      : sessionStorage.getItem("myAvatar") || "";

    if (!currentAvatar && storedUsername && !isOwnProfile) {
      api
        .get(`/v1/users/${storedUsername}`)
        .then((res) => {
          const fetchedAvatar = res.data?.body?.profilePictureUrl || "";
          if (fetchedAvatar) {
            sessionStorage.setItem("myAvatar", fetchedAvatar);
          }
        })
        .catch(() => {});
    }

    const dest = `/spatial/${routeUsername}`;
    const sub = subscribe(dest, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (!data || !data.command) return;

        if (data.command === "SPATIAL_JOIN") {
          if (data.userId && data.userId !== storedUserId) {
            setVisitors((prev) => ({
              ...prev,
              [data.userId]: {
                userId: data.userId,
                userName: data.userName || "Khách",
                avatar: data.avatar || "",
                x: Number(data.x) || 0,
                y: Number(data.y) || 0,
                lastActive: Date.now(),
              },
            }));

            // Greet newcomer with our current cursor position
            const myAvatar = isOwnProfile
              ? profileData?.profilePictureUrl || ""
              : sessionStorage.getItem("myAvatar") || "";
            sendMessage("/spatial", {
              command: "SPATIAL_CURSOR",
              spaceKey: routeUsername,
              userName: storedUsername,
              avatar: myAvatar,
              x: lastMyCursorRef.current.x,
              y: lastMyCursorRef.current.y,
            });
          }
        } else if (data.command === "SPATIAL_CURSOR") {
          if (data.userId && data.userId !== storedUserId) {
            setVisitors((prev) => ({
              ...prev,
              [data.userId]: {
                userId: data.userId,
                userName: data.userName || prev[data.userId]?.userName || "Khách",
                avatar: data.avatar || prev[data.userId]?.avatar || "",
                x: Number(data.x) || 0,
                y: Number(data.y) || 0,
                lastActive: Date.now(),
              },
            }));
          }
        } else if (data.command === "SPATIAL_REACTION") {
          if (data.emoji && data.userId !== storedUserId) {
            setLatestReaction({
              id: Date.now() + Math.random(),
              emoji: data.emoji,
              side: data.side || "right",
            });
          }
        } else if (data.command === "SPATIAL_SYNC_REACTIONS") {
          if (data.reactions) {
            const parsed = {};
            Object.keys(data.reactions).forEach((k) => {
              parsed[k] = Number(data.reactions[k]) || 0;
            });
            setSpaceReactions(parsed);
          }
        } else if (data.command === "SPATIAL_LEAVE") {
          if (data.userId) {
            setVisitors((prev) => {
              const next = { ...prev };
              delete next[data.userId];
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Failed to parse spatial message:", err);
      }
    });

    // Announce our presence to the space
    sendMessage("/spatial", {
      command: "SPATIAL_JOIN",
      spaceKey: routeUsername,
      userName: storedUsername,
      avatar: currentAvatar,
    });

    // Periodic GC for ghost cursors after 25s of inactivity
    const gcInterval = setInterval(() => {
      const now = Date.now();
      setVisitors((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((uid) => {
          if (now - next[uid].lastActive > 25000) {
            delete next[uid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 10000);

    return () => {
      clearInterval(gcInterval);
      sendMessage("/spatial", {
        command: "SPATIAL_LEAVE",
        spaceKey: routeUsername,
      });
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
    };
  }, [routeUsername, isOwnProfile, profileData?.profilePictureUrl]);

  const handleCursorMove = useCallback(
    (worldX, worldY) => {
      lastMyCursorRef.current = { x: worldX, y: worldY };
      const storedUsername = localStorage.getItem("userName") || "";
      const myAvatar = isOwnProfile
        ? profileData?.profilePictureUrl || ""
        : sessionStorage.getItem("myAvatar") || "";

      sendMessage("/spatial", {
        command: "SPATIAL_CURSOR",
        spaceKey: routeUsername,
        userName: storedUsername,
        avatar: myAvatar,
        x: worldX,
        y: worldY,
      });
    },
    [routeUsername, isOwnProfile, profileData?.profilePictureUrl]
  );

  const handleEmitReaction = useCallback(
    ({ emoji, side }) => {
      // Broadcast reaction to active spatial viewers in real-time
      sendMessage("/spatial", {
        command: "SPATIAL_REACTION",
        spaceKey: routeUsername,
        emoji,
        side,
      });

      // Persist reaction to server database
      api
        .post(`/v1/users/${routeUsername}/space/reaction`, { emoji })
        .then((res) => {
          if (res.data?.body) {
            setSpaceReactions(res.data.body);
          }
        })
        .catch((err) => {
          console.error("Failed to persist space reaction:", err);
        });
    },
    [routeUsername]
  );

  // Load saved space configuration from user-service (NEVER auto-populates unselected posts/comments)
  useEffect(() => {
    if (!routeUsername) return;
    let isMounted = true;

    const fetchSpace = async () => {
      try {
        const res = await api.get(`/v1/users/${routeUsername}/space`);
        if (!isMounted) return;
        if (res.data?.code === 200 && res.data?.body) {
          const cfg = res.data.body;
          setIsConfigured(Boolean(cfg.isConfigured));
          setTheme(cfg.theme || "COSMIC_VOID");
          setCustomAccent(cfg.customAccent || "#6366F1");
          setAllowGuestbook(cfg.allowGuestbook !== false);
          setGuestbookEntries(cfg.guestbookEntries || []);
          setAutoplayNodeId(cfg.autoplayNodeId || "");
          if (cfg.reactions) {
            setSpaceReactions(cfg.reactions);
          }
          if (cfg.defaultViewMode === "FEED") {
            setViewMode("FEED");
          } else {
            setViewMode("SPACE");
          }

          if (cfg.isConfigured && Array.isArray(cfg.nodes) && cfg.nodes.length > 0) {
            setNodes(cfg.nodes);
          } else {
            setNodes(createDefaultSpaceNodes(profileData));
          }
        }
      } catch {
        if (!isMounted) return;
        setNodes(createDefaultSpaceNodes(profileData));
      }
    };

    fetchSpace();
    return () => {
      isMounted = false;
    };
  }, [routeUsername]);

  const postsById = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      if (p?.id) map[p.id] = p;
    });
    return map;
  }, [posts]);

  // Node Manipulation Handlers
  const handleUpdateNode = useCallback((nodeId, patch) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
    );
  }, []);

  const handleBringToFront = useCallback((nodeId) => {
    setNodes((prev) => {
      const maxZ = prev.reduce((acc, item) => Math.max(acc, item.zIndex || 10), 10);
      return prev.map((n) => (n.id === nodeId ? { ...n, zIndex: Math.min(999, maxZ + 1) } : n));
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId || n.type === "IDENTITY_CORE"));
    setSelectedNodeId(null);
    setAutoplayNodeId((prev) => (prev === nodeId ? "" : prev));
  }, []);

  const handleToggleAutoplay = useCallback((nodeId) => {
    setAutoplayNodeId((prev) => (prev === nodeId ? "" : nodeId));
  }, []);

  const handleAddNodes = useCallback((newNodesArray) => {
    if (!Array.isArray(newNodesArray) || newNodesArray.length === 0) return;
    setNodes((prev) => {
      const hasNewGuestbook = newNodesArray.some((n) => n.type === "GUESTBOOK_WALL");
      const base = hasNewGuestbook
        ? prev.filter((n) => n.type !== "GUESTBOOK_WALL")
        : prev;
      if (base.length + newNodesArray.length > 60) {
        toast.error("Đã đạt giới hạn tối đa 60 vật thể trong không gian");
        return prev;
      }
      return [...base, ...newNodesArray];
    });
    setSelectedNodeId(newNodesArray[newNodesArray.length - 1].id);
  }, []);

  const handleApplyPresetLayout = useCallback((presetName) => {
    setNodes((prev) => arrangeExistingNodes(prev, presetName));
    setCamera({ panX: 0, panY: 0, zoom: 0.92 });
  }, []);

  const handleSaveSpace = async () => {
    setIsSavingSpace(true);
    try {
      const payload = {
        theme,
        defaultViewMode: viewMode === "FEED" ? "FEED" : "SPACE",
        customAccent,
        allowGuestbook,
        autoplayNodeId: autoplayNodeId || "",
        nodes: nodes.map((n, idx) => ({
          id: String(n.id),
          type: n.type,
          x: Math.max(-3000, Math.min(3000, Number(n.x) || 0)),
          y: Math.max(-3000, Math.min(3000, Number(n.y) || 0)),
          scale: Math.max(0.5, Math.min(2.5, Number(n.scale) || 1.0)),
          rotation: Math.max(-180, Math.min(180, Number(n.rotation) || 0)),
          zIndex: Math.max(0, Math.min(1000, Number(n.zIndex) || idx + 1)),
          frameStyle: n.frameStyle || "GLASS",
          content: n.content || {},
        })),
      };

      const res = await api.put("/v1/users/space", payload);
      if (res.data?.code === 200 && res.data?.body) {
        setIsConfigured(true);
        setIsBuilderMode(false);
        setSelectedNodeId(null);
        toast.success(tSpace("saveSuccess"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || tSpace("saveError"));
    } finally {
      setIsSavingSpace(false);
    }
  };

  // Guestbook Handlers
  const handleAddGuestbookEntry = async (entryPayload) => {
    try {
      const res = await api.post(`/v1/users/${routeUsername}/space/guestbook`, entryPayload);
      if (res.data?.code === 200 && res.data?.body) {
        setGuestbookEntries((prev) => [res.data.body, ...prev]);
        toast.success(tSpace("guestbookSuccess"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi ghim lưu bút");
    }
  };

  const handleDeleteGuestbookEntry = async (entryId) => {
    try {
      const res = await api.delete(`/v1/users/space/guestbook/${entryId}`);
      if (res.data?.code === 200) {
        setGuestbookEntries((prev) => prev.filter((item) => item.id !== entryId));
        toast.success(tSpace("guestbookDeleted"));
      }
    } catch {
      toast.error("Không thể xóa lời nhắn lưu bút");
    }
  };

  const renderNodeContent = (node) => {
    switch (node.type) {
      case "IDENTITY_CORE":
        return (
          <IdentityCoreNode
            node={node}
            profileData={profileData}
            isOwnProfile={isOwnProfile}
            customAccent={customAccent}
            isBuilderMode={isBuilderMode}
            onProfileUpdate={onProfileUpdate}
            onUsernameChange={onUsernameChange}
            incomingReaction={latestReaction}
            onEmitReaction={handleEmitReaction}
            initialReactions={spaceReactions}
          />
        );
      case "POST_CARD": {
        const post = postsById[node.content?.postId] || null;
        return (
          <PostExhibitNode
            node={node}
            post={post}
            isBuilderMode={isBuilderMode}
            customAccent={customAccent}
            onToggleLike={onToggleLikePost}
          />
        );
      }
      case "COMMENT_CARD": {
        const post = postsById[node.content?.postId] || null;
        return (
          <CommentExhibitNode
            node={node}
            post={post}
            isBuilderMode={isBuilderMode}
            customAccent={customAccent}
            onToggleLikePost={onToggleLikePost}
          />
        );
      }
      case "EMBED_IFRAME":
        return (
          <EmbedIframeNode
            node={node}
            isBuilderMode={isBuilderMode}
            customAccent={customAccent}
            shouldAutoplay={node.id === autoplayNodeId}
          />
        );
      case "MEDIA_FRAME":
        return <MediaFrameNode node={node} isBuilderMode={isBuilderMode} />;
      case "TEXT_NOTE":
        return <TextNoteNode node={node} customAccent={customAccent} />;
      case "AUDIO_VINYL":
        return (
          <AudioVinylNode
            node={node}
            customAccent={customAccent}
            isBuilderMode={isBuilderMode}
            shouldAutoplay={node.id === autoplayNodeId}
          />
        );
      case "PORTAL_LINK":
        return (
          <PortalFriendNode
            node={node}
            customAccent={customAccent}
            isBuilderMode={isBuilderMode}
            tSpace={tSpace}
          />
        );
      case "GUESTBOOK_WALL":
        return (
          <GuestbookWallNode
            node={node}
            entries={guestbookEntries}
            allowGuestbook={allowGuestbook}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}
            isBuilderMode={isBuilderMode}
            customAccent={customAccent}
            onAddEntry={handleAddGuestbookEntry}
            onDeleteEntry={handleDeleteGuestbookEntry}
            tSpace={tSpace}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {viewMode === "SPACE" ? (
        <>
          {/* Top Subtle Navigation / Builder Hint */}
          {!isBuilderMode ? (
            <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-black/40 text-zinc-300 border border-white/10 backdrop-blur-md text-[11px] font-medium tracking-wide">
              {tSpace("dragHint")}
            </div>
          ) : (
            <SpatialBuilderToolbar
              theme={theme}
              onThemeChange={setTheme}
              customAccent={customAccent}
              onAccentChange={setCustomAccent}
              allowGuestbook={allowGuestbook}
              onToggleAllowGuestbook={() => setAllowGuestbook((prev) => !prev)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onApplyPresetLayout={handleApplyPresetLayout}
              onSaveSpace={handleSaveSpace}
              onCancelBuilder={() => {
                setIsBuilderMode(false);
                setSelectedNodeId(null);
              }}
              isSaving={isSavingSpace}
              tSpace={tSpace}
            />
          )}

          {/* 2D / 2.5D Infinite Spatial Canvas */}
          <SpatialViewport
            theme={theme}
            customAccent={customAccent}
            camera={camera}
            onCameraChange={setCamera}
            onCanvasBackgroundClick={() => setSelectedNodeId(null)}
            onCursorMove={handleCursorMove}
            visitors={visitorsList}
            isBuilderMode={isBuilderMode}
            is3DMode={is3DMode}
          >
            {nodes.map((node) => (
              <SpatialNodeWrapper
                key={node.id}
                node={node}
                zoom={camera.zoom}
                theme={theme}
                isBuilderMode={isBuilderMode}
                is3DMode={is3DMode}
                isSelected={selectedNodeId === node.id}
                isAutoplayTarget={node.id === autoplayNodeId}
                onSelect={setSelectedNodeId}
                onUpdateNode={handleUpdateNode}
                onBringToFront={handleBringToFront}
                onToggleAutoplay={handleToggleAutoplay}
                onDeleteNode={handleDeleteNode}
                tSpace={tSpace}
              >
                {renderNodeContent(node)}
              </SpatialNodeWrapper>
            ))}
          </SpatialViewport>

          {/* Minimap Radar */}
          {showMinimap && (
            <SpatialMinimap
              nodes={nodes}
              camera={camera}
              customAccent={customAccent}
              onJumpTo={(nextPanX, nextPanY) =>
                setCamera((prev) => ({ ...prev, panX: nextPanX, panY: nextPanY }))
              }
            />
          )}

          {/* Add Spatial Artifact Modal */}
          <AddSpatialNodeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddNodes={handleAddNodes}
            posts={posts}
            files={files}
            username={routeUsername}
            customAccent={customAccent}
            tSpace={tSpace}
          />
        </>
      ) : (
        /* Classic Scrollable Feed Mode */
        <div className="w-full h-full overflow-y-auto pb-28 px-4 sm:px-6">
          {classicFeedContent}
        </div>
      )}

      {/* Persistent Floating Spatial Dock */}
      <SpatialFloatingDock
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          if (mode === "FEED") {
            setIsBuilderMode(false);
            setSelectedNodeId(null);
          }
        }}
        zoom={camera.zoom}
        onZoomIn={() =>
          setCamera((prev) => ({
            ...prev,
            zoom: Math.min(1.8, Number((prev.zoom + 0.12).toFixed(2))),
          }))
        }
        onZoomOut={() =>
          setCamera((prev) => ({
            ...prev,
            zoom: Math.max(0.4, Number((prev.zoom - 0.12).toFixed(2))),
          }))
        }
        onResetCenter={() => setCamera({ panX: 0, panY: 0, zoom: 0.92 })}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((prev) => !prev)}
        is3DMode={is3DMode}
        onToggle3DMode={() => setIs3DMode((prev) => !prev)}
        isOwnProfile={isOwnProfile}
        isBuilderMode={isBuilderMode}
        visitors={visitorsList}
        onToggleBuilderMode={() => {
          setIsBuilderMode((prev) => !prev);
          setSelectedNodeId(null);
        }}
        customAccent={customAccent}
        tSpace={tSpace}
      />
    </div>
  );
}
