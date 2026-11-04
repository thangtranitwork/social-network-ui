"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import api from "@/utils/axios";
import PostCard from "@/components/social-app-component/PostCard";
import UserHeader from "@/components/social-app-component/UserHeader";
import Avatar from "@/components/ui-components/Avatar";
import { useRouter, useSearchParams } from "next/navigation";
import { pageMetadata, usePageMetadata } from "@/utils/clientMetadata";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/formatName";
import { 
  Camera, 
  UploadCloud, 
  X, 
  Search as SearchIcon, 
  Users, 
  FileText, 
  Image as ImageIcon,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

let debounceTimeout = null;

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const applyHighlights = (content, highlights, searchQuery) => {
  if (!content) return "";
  
  const terms = new Set();

  // 1. Trích xuất các từ được Elasticsearch highlight (<mark class="search-highlight">...</mark>)
  if (Array.isArray(highlights)) {
    const markRegex = /<mark[^>]*>(.*?)<\/mark>/gi;
    highlights.forEach((h) => {
      let match;
      while ((match = markRegex.exec(h)) !== null) {
        if (match[1] && match[1].trim()) {
          terms.add(match[1].trim());
        }
      }
    });
  }

  // 2. Trích xuất các từ trong câu query tìm kiếm
  if (searchQuery && typeof searchQuery === "string") {
    searchQuery
      .trim()
      .split(/\s+/)
      .filter((word) => word.length >= 2)
      .forEach((word) => terms.add(word));
  }

  if (terms.size === 0) return content;

  // 3. Highlight từ dài trước để tránh conflict substring
  const sortedTerms = Array.from(terms).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sortedTerms.map(escapeRegExp).join("|")})`, "gi");

  return content.replace(pattern, '<mark class="search-highlight">$1</mark>');
};

function SearchContent() {
  const t = useTranslations('search');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search mode & tab: 'ALL' | 'USERS' | 'POSTS' | 'VISUAL'
  const initialTab = searchParams.get("tab")?.toUpperCase() || "ALL";
  const [activeTab, setActiveTab] = useState(["ALL", "USERS", "POSTS", "VISUAL"].includes(initialTab) ? initialTab : "ALL");

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [results, setResults] = useState({ USER: [], POST: [] });
  const [visualResults, setVisualResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visualSearching, setVisualSearching] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Image search states
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [similarSourceInfo, setSimilarSourceInfo] = useState(null);
  const fileInputRef = useRef(null);

  usePageMetadata(pageMetadata.search());

  // 1. Fetch Suggested Users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const res = await api.get("/v1/friends/suggested");
        const list = res.data?.body || res.data?.data || [];
        setSuggestedUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Lỗi lấy gợi ý bạn bè", err);
      }
    };
    fetchSuggestedUsers();
  }, []);

  // 2. Handle initial similar_file_id or file_url from query param
  useEffect(() => {
    const fileId = searchParams.get("similar_file_id") || searchParams.get("file_id");
    const fileUrl = searchParams.get("file_url");
    const targetFile = fileId || (fileUrl ? fileUrl.split("/").pop().split("?")[0] : null);

    if (targetFile) {
      setActiveTab("VISUAL");
      setSimilarSourceInfo({ fileId: targetFile, fileUrl });
      fetchSimilarSearch(targetFile);
    }
  }, [searchParams]);

  // 3. Debounced General / Text-to-Image Search
  useEffect(() => {
    if (selectedImageFile) return;

    if (!query.trim()) {
      if (activeTab !== "VISUAL") {
        setResults({ USER: [], POST: [] });
      } else if (!similarSourceInfo) {
        setVisualResults([]);
      }
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (activeTab === "VISUAL") {
        fetchVisualTextSearch(query.trim());
      } else {
        fetchGeneralSearch(query.trim(), activeTab);
      }
    }, 600);

    return () => clearTimeout(debounceTimeout);
  }, [query, activeTab, selectedImageFile]);

  // Clean preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Search API Call: Traditional Full-text search
  const fetchGeneralSearch = async (keyword, tab) => {
    try {
      setLoading(true);
      let searchType = "NOT_SET";
      if (tab === "USERS") searchType = "USER";
      if (tab === "POSTS") searchType = "POST";

      const res = await api.get("/v1/search", {
        params: {
          query: keyword,
          type: searchType,
          page: 0,
          size: 20,
        },
      });
      setResults(res.data.body || { USER: [], POST: [] });
    } catch (err) {
      console.error("Lỗi tìm kiếm", err);
    } finally {
      setLoading(false);
    }
  };

  // Search API Call: Visual Cross-modal Text-to-Image
  const fetchVisualTextSearch = async (keyword) => {
    try {
      setVisualSearching(true);
      const res = await api.get("/v1/search/visual", {
        params: {
          query: keyword,
          limit: 20,
        },
      });
      setVisualResults(res.data.body || []);
    } catch (err) {
      console.error("Lỗi tìm kiếm hình ảnh bằng mô tả", err);
      if (err.response?.status === 429) {
        toast.error(t('rateLimitText'));
      } else {
        toast.error("Tìm kiếm hình ảnh thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setVisualSearching(false);
    }
  };

  // Search API Call: Image-to-Image visual search via file upload
  const performImageSearch = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t('invalidImage'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('invalidImage'));
      return;
    }

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
    setSelectedImageFile(file);
    setSimilarSourceInfo(null);
    setActiveTab("VISUAL");

    const formData = new FormData();
    formData.append("image", file);

    try {
      setVisualSearching(true);
      const res = await api.post("/v1/search/image?limit=20", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVisualResults(res.data.body || []);
    } catch (err) {
      console.error("Lỗi tìm kiếm bằng hình ảnh", err);
      if (err.response?.status === 429) {
        toast.error(t('rateLimitImage'));
      } else {
        toast.error("Không thể xử lý hình ảnh này. Vui lòng thử lại.");
      }
    } finally {
      setVisualSearching(false);
    }
  };

  // Search API Call: 1-Click Similar Search
  const fetchSimilarSearch = async (fileId) => {
    try {
      setVisualSearching(true);
      const res = await api.get("/v1/search/similar", {
        params: {
          file_id: fileId,
          limit: 20,
        },
      });
      setVisualResults(res.data.body || []);
    } catch (err) {
      console.error("Lỗi tìm ảnh tương tự", err);
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error(t('errorImagePermissions'));
      } else if (err.response?.status === 429) {
        toast.error(t('rateLimitImage'));
      } else {
        toast.error(t('similarSearchFailed'));
      }
    } finally {
      setVisualSearching(false);
    }
  };

  // File Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) performImageSearch(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) performImageSearch(file);
  };

  const handleClearImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setSimilarSourceInfo(null);
    setVisualResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (query.trim()) {
      fetchVisualTextSearch(query.trim());
    }
  };

  const goToProfile = (username) => {
    if (username) router.push(`/profile/${username}`);
  };

  const filterTabs = [
    { key: "ALL", label: t('tabs.all') || t('all') },
    { key: "USERS", label: t('tabs.users') || t('users'), icon: <Users size={14} /> },
    { key: "POSTS", label: t('tabs.posts') || t('posts'), icon: <FileText size={14} /> },
    { key: "VISUAL", label: t('tabs.visual') || "Hình ảnh", icon: <ImageIcon size={14} /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 py-6 max-w-6xl mx-auto">
      {/* Cột trái / Trung tâm */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Tiêu đề & Ô tìm kiếm */}
        <div className="space-y-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--card-foreground)]">
              {t('title')}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {activeTab === "VISUAL" 
                ? (t('subtitleVisual') || "Khám phá bài viết qua hình ảnh hoặc mô tả nội dung ảnh")
                : (t('subtitleGeneral') || "Tìm kiếm bạn bè, bài viết và nội dung trên PocPoc")}
            </p>
          </div>

          {/* Ô tìm kiếm tích hợp nút Camera */}
          <div className="relative flex items-center">
            <SearchIcon size={18} className="absolute left-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "VISUAL" 
                  ? (t('placeholderVisual') || "Nhập mô tả hình ảnh cần tìm (VD: mèo con, xe máy, bãi biển)...")
                  : t('placeholder')
              }
              className="w-full pl-10 pr-24 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-[var(--card-foreground)] placeholder:text-[var(--muted-foreground)] shadow-xs"
            />
            
            <div className="absolute right-2.5 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 rounded-full text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--muted)] transition-colors"
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}

              {/* Nút Camera tải ảnh nhanh */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveTab("VISUAL");
                  fileInputRef.current?.click();
                }}
                className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  selectedImageFile || activeTab === "VISUAL"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] border-transparent"
                }`}
                title={t('searchByImage')}
              >
                <Camera size={15} />
                <span className="hidden sm:inline">{t('imageBtn') || "Ảnh"}</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs phẳng, thanh thoát, cuộn mượt trên Mobile */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--muted)]/30 rounded-2xl border border-[var(--border)] overflow-x-auto scrollbar-none flex-nowrap">
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-xs font-bold border border-[var(--border)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab: HÌNH ẢNH (VISUAL SEARCH) */}
        {activeTab === "VISUAL" && (
          <div className="space-y-4">
            {/* Ảnh đang được chọn làm điều kiện tìm kiếm */}
            {selectedImageFile || imagePreviewUrl ? (
              <div className="p-3.5 border border-[var(--border)] rounded-2xl bg-[var(--card)] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] shrink-0 bg-[var(--muted)]">
                    <img
                      src={imagePreviewUrl}
                      alt="Query visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--card-foreground)] truncate">
                      {selectedImageFile?.name || t('selectedImage') || "Hình ảnh đã chọn"}
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                      {Math.round((selectedImageFile?.size || 0) / 1024)} KB &bull; {t('searchingSimilar') || "Đang tìm bài viết tương đồng"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-xs font-medium rounded-xl transition-all text-[var(--card-foreground)]"
                  >
                    {t('changeImage')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title={t('clearImage')}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : similarSourceInfo ? (
              <div className="p-3.5 border border-[var(--border)] rounded-2xl bg-[var(--card)] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <ImageIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--card-foreground)] truncate">
                      {t('searchByOriginImage') || "Tìm theo ảnh gốc"}
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate max-w-xs sm:max-w-md">
                      File: {similarSourceInfo.fileId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSimilarSourceInfo(null);
                    setVisualResults([]);
                  }}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--muted)] rounded-xl transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              /* Khung kéo thả ảnh tối giản, hiện đại */
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-500/5 scale-[1.005]"
                    : "border-[var(--border)] hover:border-indigo-400 bg-[var(--card)] hover:bg-[var(--muted)]/20"
                }`}
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2.5">
                  <UploadCloud size={20} />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[var(--card-foreground)]">
                  {isDragOver ? t('dropImageHere') : t('uploadImage')}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                  {t('uploadHint') || "Hỗ trợ JPEG, PNG, WebP (Tối đa 10MB) • Hoặc nhập mô tả ảnh ở thanh tìm kiếm"}
                </p>
              </div>
            )}

            {/* Trạng thái đang tải */}
            {visualSearching && (
              <div className="py-12 text-center space-y-2.5">
                <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('searchingVisual')}</p>
              </div>
            )}

            {/* Không có kết quả */}
            {!visualSearching && visualResults.length === 0 && (selectedImageFile || query || similarSourceInfo) && (
              <div className="py-12 text-center space-y-2 border border-[var(--border)] rounded-2xl bg-[var(--card)]">
                <ImageIcon size={32} className="mx-auto text-[var(--muted-foreground)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--card-foreground)]">{t('noResults')}</p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                  {t('noVisualMatchDesc')}
                </p>
              </div>
            )}

            {/* Danh sách bài viết khớp ảnh */}
            {!visualSearching && visualResults.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--card-foreground)] tracking-wide">
                    {t('similarPosts')} ({visualResults.length})
                  </h2>
                </div>

                <div className="space-y-4">
                  {visualResults.map((item, index) => {
                    const post = item.post || item;
                    const postData = {
                      ...post,
                      id: post.id || item.post_id || item.postId,
                      content: post.content ?? item.content ?? "",
                      author: post.author || item.author,
                      privacy: post.privacy || item.privacy,
                      files: post.files || post.images || item.files || [],
                      images: post.images || post.files || item.images || [],
                      createdAt: post.createdAt || item.createdAt || item.created_at,
                      likeCount: post.likeCount ?? item.likeCount ?? 0,
                      commentCount: post.commentCount ?? item.commentCount ?? 0,
                      shareCount: post.shareCount ?? item.shareCount ?? 0,
                      liked: post.liked ?? false,
                    };
                    return (
                      <PostCard
                        key={postData.id || index}
                        post={postData}
                        highlightedFileId={item.matchedFileId || item.matched_file_id}
                        relevanceLabel={item.relevanceLabel || item.relevance_label}
                        rawCosine={item.rawCosine || item.raw_cosine}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: TÌM KIẾM TRUYỀN THỐNG (ALL, USERS, POSTS) */}
        {activeTab !== "VISUAL" && (
          <div className="space-y-5">
            {loading && <p className="text-xs text-[var(--muted-foreground)]">{t('searching')}</p>}

            {!loading && query && (!results.USER || results.USER.length === 0) && (!results.POST || results.POST.length === 0) && (
              <div className="py-12 text-center space-y-1.5 border border-[var(--border)] rounded-2xl bg-[var(--card)]">
                <p className="text-sm font-semibold text-[var(--card-foreground)]">{t('noResults')}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{t('tryDifferentKeywords')}</p>
              </div>
            )}

            {/* Users section */}
            {(activeTab === "ALL" || activeTab === "USERS") && results.USER && results.USER.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-xs sm:text-sm font-bold text-[var(--card-foreground)] tracking-wide flex items-center gap-1.5">
                  <Users size={15} className="text-indigo-600" />
                  <span>{t('users')}</span>
                </h2>
                <ul className="space-y-2">
                  {results.USER.map((user) => (
                    <li
                      key={user.id}
                      className="p-3.5 border border-[var(--border)] rounded-2xl bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all cursor-pointer"
                      onClick={() => goToProfile(user.username)}
                    >
                      <UserHeader
                        user={{
                          familyName: user.familyName,
                          givenName: user.givenName,
                          profilePictureUrl: user.profilePictureUrl,
                          lastOnline: user.isOnline ? "Online" : user.lastOnline,
                        }}
                        showOptions={false}
                        className="p-0"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Posts section */}
            {(activeTab === "ALL" || activeTab === "POSTS") && results.POST && results.POST.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-xs sm:text-sm font-bold text-[var(--card-foreground)] tracking-wide flex items-center gap-1.5">
                  <FileText size={15} className="text-indigo-600" />
                  <span>{t('posts')}</span>
                </h2>
                <div className="space-y-3.5">
                  {results.POST.map((post) => {
                    const postWithHighlight = {
                      ...post,
                      content: applyHighlights(post.content, post.highlights, query),
                    };
                    return (
                      <PostCard key={post.id} post={postWithHighlight} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cột phải: Gợi ý bạn bè */}
      <div className="w-full lg:w-[320px] shrink-0">
        <div className="sticky top-20 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--card-foreground)]">{t('suggestions')}</h2>
            <button
              onClick={() => router.push("/friends?tab=suggestions")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors flex items-center gap-0.5"
            >
              <span>{t('seeAll')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {suggestedUsers.length === 0 ? (
              <div className="p-4 border border-[var(--border)] rounded-2xl bg-[var(--card)] text-center">
                <p className="text-xs text-[var(--muted-foreground)]">{t('noSuggestions')}</p>
              </div>
            ) : (
              suggestedUsers.slice(0, 8).map((user) => {
                const displayName = formatFullName(user) || "Người dùng";
                return (
                  <div
                    key={user.id || user.userId}
                    className="p-3 border border-[var(--border)] rounded-2xl bg-[var(--card)] hover:bg-[var(--muted)]/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      onClick={() => goToProfile(user.username)}
                    >
                      <Avatar
                        src={user.profilePictureUrl || user.avatar || ""}
                        alt={user.username || displayName}
                        size={36}
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--card-foreground)] truncate group-hover:underline">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                          {user.mutualFriendsCount > 0
                            ? t('mutualFriends', { count: user.mutualFriendsCount })
                            : `@${user.username}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => goToProfile(user.username)}
                      className="px-2.5 py-1 text-xs font-medium rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--muted-foreground)]/30 text-[var(--card-foreground)] shrink-0 transition-colors"
                    >
                      {t('viewProfile') || "Xem"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const t = useTranslations('search');
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--muted-foreground)]">{t('loading')}</div>}>
      <SearchContent />
    </Suspense>
  );
}