import Avatar from "../ui-components/Avatar"
import { useTranslations, useFormatter } from "next-intl"
import { formatFullName } from "@/utils/formatName"

export default function PostHeader({ author, createdAt }) {
  const format = useFormatter();
  return (
    <div className="flex items-center gap-3">
      <Avatar src={author?.profilePictureUrl} alt={author?.username} />
      <div>
        <p className="font-semibold text-sm">{formatFullName(author)}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {format.dateTime(new Date(createdAt), 'short')}
        </p>
      </div>
    </div>
  )
}
