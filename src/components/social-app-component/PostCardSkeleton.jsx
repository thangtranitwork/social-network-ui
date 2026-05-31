export default function PostSkeleton () {
    return (
        <div
            className="w-full bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm my-2"
        >
            {/* Header skeleton */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 skeleton rounded-full"></div>
                    <div>
                        <div className="h-4 skeleton rounded w-24 sm:w-32 mb-2"></div>
                        <div className="h-3 skeleton rounded w-16 sm:w-20"></div>
                    </div>
                </div>
                <div className="w-5 h-5 skeleton rounded-full"></div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-2 mb-4 mt-2">
                <div className="h-4 skeleton rounded w-full"></div>
                <div className="h-4 skeleton rounded w-5/6"></div>
            </div>

            {/* Image skeleton */}
            <div className="aspect-video w-full skeleton rounded-lg mb-4"></div>

            {/* Actions skeleton */}
            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-[var(--border)]">
                <div className="h-5 w-5 skeleton rounded-full"></div>
                <div className="h-5 w-5 skeleton rounded-full"></div>
                <div className="h-5 w-5 skeleton rounded-full"></div>
                <div className="h-5 w-5 skeleton rounded-full"></div>
            </div>
            
            <div className="h-3 skeleton rounded w-24 mt-4"></div>
            <div className="h-3 skeleton rounded w-40 mt-2"></div>
        </div>
    )
}
