export default function PostSkeleton () {
    return (
        <div
            className="w-full max-w-[600px] bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm animate-pulse my-2"
        >
            {/* Header skeleton */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20"></div>
                    </div>
                </div>
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-2 mb-4 mt-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>

            {/* Image skeleton */}
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>

            {/* Actions skeleton */}
            <div className="flex items-center gap-6 mt-3">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 mt-2"></div>
        </div>
    )
}
