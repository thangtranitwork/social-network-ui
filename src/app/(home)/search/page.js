"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import api from "@/utils/axios";
import PostCard from "@/components/social-app-component/PostCard";
import Input from "@/components/ui-components/Input";
import UserHeader from "@/components/social-app-component/UserHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { pageMetadata, usePageMetadata } from "@/utils/clientMetadata";
import { useTranslations } from "next-intl";
import { 
  Camera, 
  Sparkles, 
  UploadCloud, 
  X, 
  Search as SearchIcon, 
  Users, 
  FileText, 
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

let debounceTimeout = null;

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
        setSuggestedUsers(res.data.body || []);
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
    if (selectedImageFile) return; // Prioritize image search if file is selected

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
        toast.error("Không tìm thấy ảnh hoặc bạn không có quyền xem bài viết chứa ảnh này");
      } else if (err.response?.status === 429) {
        toast.error(t('rateLimitImage'));
      } else {
        toast.error("Tìm kiếm ảnh tương tự thất bại");
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Cột trái / Trung tâm */}
      <div className="flex-1 space-y-6">
        {/* Tiêu đề & Input Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-[var(--card-foreground)]">
              {t('title')}
            </h1>
            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 bg-[var(--muted)]/50 px-3 py-1 rounded-full border border-[var(--border)]">
              <Sparkles size={13} className="text-amber-500" />
              <span>AI Vector Search v3.0</span>
            </span>
          </div>

          {/* Search Bar with Camera Upload Button */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTab === "VISUAL" ? "Mô tả hình ảnh cần tìm (VD: mèo con, bãi biển hoàng hôn, xe máy)..." : t('placeholder')}
                className="w-full pl-10 pr-12 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-[var(--card-foreground)] shadow-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] p-1 rounded-full hover:bg-[var(--muted)]"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Camera / Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-sm font-semibold shadow-xs ${
                selectedImageFile || activeTab === "VISUAL"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                  : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)] text-[var(--card-foreground)]"
              }`}
              title={t('searchByImage')}
            >
              <Camera size={19} />
              <span className="hidden sm:inline">{t('searchByImage')}</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => { setActiveTab("ALL"); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              <span>{t('all')}</span>
            </button>
            <button
              onClick={() => { setActiveTab("USERS"); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "USERS"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              <Users size={14} />
              <span>{t('users')}</span>
            </button>
            <button
              onClick={() => { setActiveTab("POSTS"); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "POSTS"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              <FileText size={14} />
              <span>{t('posts')}</span>
            </button>
            <button
              onClick={() => { setActiveTab("VISUAL"); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "VISUAL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              <Sparkles size={14} className={activeTab === "VISUAL" ? "text-amber-300" : "text-amber-500"} />
              <span>{t('visualSearch')}</span>
            </button>
          </div>
        </div>

        {/* Tab: VISUAL SEARCH Content */}
        {activeTab === "VISUAL" && (
          <div className="space-y-5">
            {/* Image Upload Dropzone or Active Preview */}
            {selectedImageFile || imagePreviewUrl ? (
              <div className="p-4 border border-indigo-500/30 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-indigo-400 shadow-md shrink-0">
                    <img
                      src={imagePreviewUrl}
                      alt="Query visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <p className="text-sm font-bold text-[var(--card-foreground)]">Đang tìm kiếm bằng hình ảnh</p>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {selectedImageFile?.name || "Hình ảnh đã chọn"} ({Math.round((selectedImageFile?.size || 0) / 1024)} KB)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] text-xs font-semibold rounded-xl transition-all text-[var(--card-foreground)]"
                  >
                    {t('changeImage')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
                  >
                    <X size={13} />
                    <span>{t('clearImage')}</span>
                  </button>
                </div>
              </div>
            ) : similarSourceInfo ? (
              <div className="p-4 border border-indigo-500/30 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--card-foreground)]">Tìm bài viết có hình ảnh tương tự</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate max-w-md">
                      File ID: {similarSourceInfo.fileId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSimilarSourceInfo(null);
                    setVisualResults([]);
                  }}
                  className="px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] text-xs font-semibold rounded-xl transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                    : "border-[var(--border)] hover:border-indigo-400 bg-[var(--card)] hover:bg-[var(--muted)]/40"
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-bold text-[var(--card-foreground)]">
                  {isDragOver ? t('dropImageHere') : t('uploadImage')}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Hỗ trợ JPEG, PNG, WebP (Tối đa 10MB). Hoặc gõ từ khóa ở trên để tìm bài viết bằng mô tả ảnh!
                </p>
              </div>
            )}

            {/* Visual Search Results */}
            {visualSearching && (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">{t('searchingVisual')}</p>
              </div>
            )}

            {!visualSearching && visualResults.length === 0 && (selectedImageFile || query || similarSourceInfo) && (
              <div className="py-12 text-center space-y-2">
                <ImageIcon size={36} className="mx-auto text-[var(--muted-foreground)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">{t('noResults')}</p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                  Không tìm thấy bài viết nào có hình ảnh tương đồng vượt qua ngưỡng chính xác yêu cầu.
                </p>
              </div>
            )}

            {!visualSearching && visualResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--card-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>{t('similarPosts')} ({visualResults.length})</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  {visualResults.map((item) => {
                    const postData = {
                      id: item.post_id,
                      content: item.content,
                      author: item.author,
                      privacy: item.privacy,
                      files: item.files || [],
                      createdAt: item.created_at,
                      relevance_label: item.relevance_label,
                      raw_cosine: item.raw_cosine,
                      matched_image: item.matched_image,
                    };
                    return (
                      <PostCard
                        key={item.post_id}
                        post={postData}
                        highlightedFileId={item.matched_image?.file_id}
                        relevanceLabel={item.relevance_label}
                        rawCosine={item.raw_cosine}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Traditional Search (ALL, USERS, POSTS) */}
        {activeTab !== "VISUAL" && (
          <div className="space-y-6">
            {loading && <p className="text-sm text-[var(--muted-foreground)]">{t('searching')}</p>}

            {!loading && query && (!results.USER || results.USER.length === 0) && (!results.POST || results.POST.length === 0) && (
              <p className="text-[var(--muted-foreground)]">{t('noResults')}</p>
            )}

            {/* Users section */}
            {(activeTab === "ALL" || activeTab === "USERS") && results.USER && results.USER.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  <span>{t('users')}</span>
                </h2>
                <ul className="space-y-2">
                  {results.USER.map((user) => (
                    <li
                      key={user.id}
                      className="p-4 border border-[var(--border)] rounded-2xl bg-[var(--card)] hover:bg-[var(--muted)] transition-all cursor-pointer card-hover-effect"
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
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  <span>{t('posts')}</span>
                </h2>
                <div className="space-y-3">
                  {results.POST.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cột phải: Gợi ý bạn bè */}
      <div className="w-full lg:w-[320px] shrink-0">
        <div className="sticky top-20 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--card-foreground)]">{t('suggestions')}</h2>
          <ul className="space-y-3">
            {suggestedUsers.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t('noSuggestions')}</p>
            ) : (
              suggestedUsers.map((user) => (
                <li
                  key={user.id}
                  className="p-4 border border-[var(--border)] rounded-2xl bg-[var(--card)] hover:bg-[var(--muted)] transition-all cursor-pointer card-hover-effect"
                  onClick={() => goToProfile(user.username)}
                >
                  <UserHeader
                    user={{
                      familyName: user.familyName,
                      givenName: user.givenName,
                      profilePictureUrl: user.avatar || user.profilePictureUrl,
                      lastOnline: user.isOnline ? "Online" : user.lastOnline,
                    }}
                    showOptions={false}
                    className="p-0"
                  />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Đang tải trang tìm kiếm...</div>}>
      <SearchContent />
    </Suspense>
  );
}
