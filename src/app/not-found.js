"use client"

import Button from "@/components/ui-components/Button"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-white px-4">
      {/* Logo tên trang */}
      <h1 className="text-3xl font-bold mb-2 text-gray-800">pocpoc</h1>

      {/* 404 Illustration */}
      <div className="relative w-full max-w-md h-64 mb-6">
        <Image 
          src="/404.png" // <-- Đổi thành đúng đường dẫn ảnh bạn muốn
          alt="404 Illustration"
          fill
          className="object-contain"
        />
      </div>

      {/* Text */}
      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-700 mb-2">404</h2>
      <p className="text-lg text-gray-500 mb-6">uh-oh! Nothing here...</p>

      {/* Nút quay lại trang chủ */}
      <Button 
        onClick={() => router.push("/")}
        className=" text-white font-semibold py-2 px-6 rounded-full transition"
      >
        Go Back Home
      </Button>
    </div>
  )
}
