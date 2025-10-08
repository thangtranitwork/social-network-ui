"use client";

import { Suspense } from "react";
import ChatLayoutInner from "./ChatLayoutInner";

export default function ChatLayoutPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Đang tải chat...</div>}>
      <ChatLayoutInner />
    </Suspense>
  );
}
