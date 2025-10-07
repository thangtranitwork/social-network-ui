"use client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function GifPicker({ onSend }) {
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [query, setQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // 🔁 Debounce input 500ms
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 500);
        return () => clearTimeout(handler);
    }, [query]);

    // 🔍 Gọi API Giphy khi debouncedQuery thay đổi
    useEffect(() => {
        const fetchGifs = async () => {
            if (!debouncedQuery) {
                setGifs([]);
                return;
            }
            try {
                const res = await axios.get("https://api.giphy.com/v1/gifs/search", {
                    params: {
                        api_key: process.env.NEXT_PUBLIC_GIPHY_API_KEY,
                        q: debouncedQuery,
                        limit: 20,
                    },
                });
                setGifs(res.data.data);
            } catch (err) {
                console.error("Error fetching GIFs:", err);
            }
        };
        fetchGifs();
    }, [debouncedQuery]);

    const handleSelect = (gifUrl) => {
        onSend(gifUrl);
        setShowGifPicker(false);
        setQuery("");
        setGifs([]);
    };

    return (
        <div className="relative">
            {/* Nút mở GIF picker */}
            <button
                onClick={() => setShowGifPicker((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Gửi GIF"
            >
                <div role="img" aria-label="Icon file with controls" className="w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <path d="M4 4C4 3.44772 4.44772 3 5 3H14H14.5858C14.851 3 15.1054 3.10536 15.2929 3.29289L19.7071 7.70711C19.8946 7.89464 20 8.149 20 8.41421V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M20 8H15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <div className="absolute bottom-12 left-0 bg-white border rounded-lg p-2 w-80 h-64 overflow-y-auto shadow-lg z-50">
                    <input
                        type="text"
                        placeholder="Tìm GIF..."
                        className="w-full border p-1 mb-2 rounded text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />

                    {gifs.length === 0 && debouncedQuery && (
                        <p className="text-gray-500 text-sm text-center mt-4">
                            Không tìm thấy GIF nào.
                        </p>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        {gifs.map((g) => (
                            <img
                                key={g.id}
                                src={g.images.fixed_height_small.url}
                                className="cursor-pointer rounded hover:opacity-80"
                                onClick={() => handleSelect(g.images.original.url)}
                                alt="GIF"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
