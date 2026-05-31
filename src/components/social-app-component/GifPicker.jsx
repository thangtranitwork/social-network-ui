"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function GifPicker({ onSend, disabled }) {
    const t = useTranslations("chat");
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [query, setQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [loading, setLoading] = useState(false);

    // 🔁 Debounce input 500ms
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 400);
        return () => clearTimeout(handler);
    }, [query]);

    // 🔍 Gọi API Giphy khi debouncedQuery hoặc showGifPicker thay đổi
    useEffect(() => {
        const fetchGifs = async () => {
            if (!showGifPicker) return;
            
            setLoading(true);
            try {
                let res;
                if (!debouncedQuery) {
                    // Tải trending GIF nếu ô tìm kiếm trống
                    res = await axios.get("https://api.giphy.com/v1/gifs/trending", {
                        params: {
                            api_key: process.env.NEXT_PUBLIC_GIPHY_API_KEY,
                            limit: 20,
                        },
                    });
                } else {
                    res = await axios.get("https://api.giphy.com/v1/gifs/search", {
                        params: {
                            api_key: process.env.NEXT_PUBLIC_GIPHY_API_KEY,
                            q: debouncedQuery,
                            limit: 20,
                        },
                    });
                }
                setGifs(res.data.data || []);
            } catch (err) {
                console.error("Error fetching GIFs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGifs();
    }, [debouncedQuery, showGifPicker]);

    const handleSelect = (gifUrl) => {
        onSend(gifUrl);
        setShowGifPicker(false);
        setQuery("");
        setGifs([]);
    };

    return (
        <div className="relative flex items-center justify-center">
            {/* Nút mở GIF picker */}
            <button
                type="button"
                onClick={() => !disabled && setShowGifPicker((prev) => !prev)}
                disabled={disabled}
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
                    disabled
                        ? "text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
                title={t("sendGif")}
            >
                <div role="img" aria-label="Icon file with controls" className="w-5 h-5 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                        <path d="M4 4C4 3.44772 4.44772 3 5 3H14H14.5858C14.851 3 15.1054 3.10536 15.2929 3.29289L19.7071 7.70711C19.8946 7.89464 20 8.149 20 8.41421V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M20 8H15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 13H8C7.44772 13 7 13.4477 7 14V16C7 16.5523 7.44772 17 8 17H8.5C9.05228 17 9.5 16.5523 9.5 16V15.5"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 15.5H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 13V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 17V13L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.5 15H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </button>

            {/* Popup tìm kiếm GIF */}
            {showGifPicker && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowGifPicker(false)}
                    />
                    <div className="absolute bottom-12 left-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 w-80 h-80 shadow-2xl z-50 flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <input
                            type="text"
                            placeholder={t("searchGifPlaceholder")}
                            className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-3 py-2 rounded-xl text-sm placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />

                        <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                </div>
                            ) : gifs.length === 0 ? (
                                <p className="text-[var(--muted-foreground)] text-xs text-center mt-12">
                                    {debouncedQuery ? t("noGifsFound") : t("noTrendingGifs")}
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 p-0.5">
                                    {gifs.map((g) => (
                                        <div 
                                            key={g.id} 
                                            className="relative h-20 overflow-hidden rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-blue-500 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer"
                                            onClick={() => handleSelect(g.images.original.url)}
                                        >
                                            <img
                                                src={g.images.fixed_height_small.url}
                                                className="w-full h-full object-cover"
                                                alt="GIF"
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
