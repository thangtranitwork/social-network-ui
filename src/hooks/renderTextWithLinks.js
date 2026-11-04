export const renderTextWithLinks = (text) => {
    if (!text || typeof text !== "string") return text;

    // Combined regex for <mark class="search-highlight">...</mark> and URLs
    const combinedRegex = /(<mark class="search-highlight">[\s\S]*?<\/mark>)|((?:https?:\/\/|www\.)[^\s<>"'`]+|(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(?:\/[^\s<>"'`]*)?)/gi;

    const elements = [];
    let lastIndex = 0;

    let match;
    while ((match = combinedRegex.exec(text)) !== null) {
        const { index } = match;
        const fullMatch = match[0];

        // Thêm text trước match
        if (index > lastIndex) {
            elements.push(text.slice(lastIndex, index));
        }

        if (match[1]) {
            // Xử lý search highlight tag
            const innerText = match[1].replace(/<\/?mark[^>]*>/gi, "");
            elements.push(
                <mark
                    key={`mark-${index}`}
                    className="search-highlight font-semibold bg-indigo-500/15 dark:bg-indigo-400/25 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded mx-0.5 inline"
                >
                    {innerText}
                </mark>
            );
        } else if (match[2]) {
            // Xử lý URL đầy đủ
            const url = match[2];
            const href = url.startsWith("http") ? url : `https://${url}`;

            elements.push(
                <a
                    key={`url-${index}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-indigo-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    {url}
                </a>
            );
        }

        lastIndex = index + fullMatch.length;
    }

    // Thêm phần text còn lại sau cùng
    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }

    return elements;
};
