import React from 'react';
import { useTranslations } from 'next-intl';

const TypingIndicator = ({ isTyping, typingUser }) => {
  const t = useTranslations('chat');
  if (!isTyping) return null;

  return (
    <div className="px-4 py-2 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1">
          <span>
            {t('typingWithUser', { name: typingUser?.displayName || typingUser?.username || t('someone') })}
          </span>
        </div>
        
        {/* Animated dots */}
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;