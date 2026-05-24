// Use system fonts to avoid Google Fonts network fetch (IPv6 issues on some networks)
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };
export const metadata = {
    title: "PocPoc - Đăng nhập / Đăng ký",
    description: "PocPoc là nơi bạn gặp gỡ bạn mới, chia sẻ câu chuyện và luôn được là chính mình. Đăng nhập hoặc tạo tài khoản miễn phí để bắt đầu kết nối!",
    icons: {
        icon: "/pocpoc.png",
    },
};
export default function MainLayout({children}) {

    return (

        <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            {children}
        </div>
    );
}