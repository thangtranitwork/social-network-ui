import Avatar from "../ui-components/Avatar"

export default function PostHeader({ author, createdAt }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={author?.profilePictureUrl} alt={author?.username} />
      <div>
        <p className="font-semibold text-sm">{author?.givenName} {author?.familyName}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {new Date(createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
