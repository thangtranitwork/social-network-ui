# 📊 Kế Hoạch Cải Tiến Giao Diện Admin (Admin UI/UX Improvement Plan)
### Target Aesthetic: **Modern Minimal Glassmorphism & Electric Jade** — Thống nhất, sang trọng, trực quan, chuyên nghiệp.

> [!NOTE]
> Giao diện Admin hiện tại (`social-network-ui/src/app/admin`) đang sử dụng các thành phần rời rạc, màu sắc biểu đồ không đồng bộ, thẻ chỉ số (Stat Cards) dùng dải màu gradient lỗi thời, các bộ lọc input ngày/tháng để thô mộc và thiếu trải nghiệm mượt mà. Kế hoạch này sẽ nâng cấp toàn bộ giao diện quản trị lên một tầm cao mới, đồng bộ với triết lý thiết kế **Electric Jade** của PocPoc.

---

## 📊 TIẾN ĐỘ THỰC HIỆN (Status)
- [ ] **Phase 1: Admin Layout & Sidebar Upgrade** (Nâng cấp sidebar điều hướng, header & cấu trúc nền)
- [ ] **Phase 2: Analytics & Recharts Harmonization** (Đồng bộ bảng màu biểu đồ, thiết kế tooltip và vùng gradient cao cấp)
- [ ] **Phase 3: Sleek Stat Cards & Filters** (Thiết kế lại thẻ chỉ số dạng Glassmorphism, phong cách hóa các input bộ lọc)
- [ ] **Phase 4: User/Post Management Grid & Table Refresh** (Cải tiến danh sách User/Post, tối ưu hóa các nút Action và Modal quản lý)

---

## 🔍 Đánh Giá Hiện Trạng & Vấn Đề (UI/UX Audit)

### ❌ Các điểm hạn chế hiện tại:
1. **Layout & Sidebar đơn điệu:**
   * File: [layout.js (dashboard)](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/layout.js)
   * Chỉ có một header phẳng với tiêu đề tĩnh và một nút chuyển đổi đơn giản. Chưa có Sidebar quản trị thực thụ để quản lý các tính năng mở rộng sau này.
   * Lạm dụng thuộc tính `style={{ backgroundColor: "var(--card)" }}` thay vì dùng các utility class Tailwind thống nhất.
2. **Stat Cards lỗi thời:**
   * Các khối màu Gradient dạng cũ (`from-blue-500 to-blue-600`, `from-purple-500 to-purple-600`) tạo cảm giác chắp vá, không đồng bộ với thiết kế Gen-Z tối giản của app chính.
3. **Biểu đồ rời rạc (Chart Chaos):**
   * Files: [users/page.js](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/users/page.js), [posts/page.js](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/posts/page.js)
   * Sử dụng quá nhiều màu sắc cơ bản tương phản mạnh (`#3B82F6`, `#8B5CF6`, `#F5CBCB`, `#10B981`) trong Recharts.
   * Tooltip và lưới nền biểu đồ (Cartesian Grid) thô cứng, thiếu hiệu ứng đổ bóng và mờ kính (backdrop-blur).
4. **Bộ lọc Input mộc (Raw Date/Week Inputs):**
   * Các thẻ `<input type="date">`, `type="week"`, `type="month"` hiển thị theo giao diện mặc định của trình duyệt, cực kỳ lệch tông với tổng thể thiết kế.
5. **Giao diện quản lý Danh sách rối rắm:**
   * Files: [viewusers/page.jsx](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/viewusers/page.jsx), [viewposts/page.js](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/viewposts/page.js)
   * Thẻ thông tin user chứa quá nhiều dòng text nhỏ li ti (`Joined`, `Age`, `Born`, `Email`) kéo dài theo chiều dọc, thiếu sự phân cấp thông tin trực quan.
   * Các nút thao tác như khóa (Suspend) và mở khóa đặt thô kệch ở đáy card.

---

## 📐 Chi Tiết Các Bước Cải Tiến (Proposed Changes)

### 🚀 Phase 1 — Tái Cấu Trúc Layout & Menu Quản Trị (Admin Navigation Hub)
*   **Mục tiêu:** Thiết kế sidebar dạng **Glassmorphism Sidebar** mượt mà ở bên trái, hỗ trợ responsive đóng mở, tích hợp logo và thông tin tài khoản admin.
*   **Chi tiết thay đổi trong** [layout.js (dashboard)](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/layout.js):
    *   Xây dựng Sidebar cố định bên trái (hoặc tự thu gọn trên mobile) với các menu liên kết trực quan sử dụng Lucide Icons:
        *   `📊 Thống kê chung` (Dashboard chính)
        *   `👥 Quản lý người dùng` (User Management)
        *   `📝 Quản lý bài viết` (Post Management)
    *   Header trên cùng thu gọn, tập trung hiển thị Breadcrumb, trạng thái hệ thống, và khu vực chuyển đổi ngôn ngữ/Theme.

### ⚡ Phase 2 — Đồng Bộ Hệ Thống Biểu Đồ (Premium Charts & Recharts Theme)
*   **Mục tiêu:** Sử dụng palette màu **Electric Jade & Deep Amethyst** thời thượng để biểu diễn dữ liệu.
*   **Chi tiết thay đổi trong** [users/page.js](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/users/page.js) và [posts/page.js](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/posts/page.js):
    *   **Palette màu thống nhất:**
        *   `Primary Accent` (Thống kê chính): Sử dụng màu **Electric Jade** (`#00E5A0`).
        *   `Secondary/Trend` (Xu hướng/Mới): Sử dụng màu **Indigo/Purple** (`#6366F1` hoặc `#8B5CF6`).
        *   `Grid lines`: Giảm độ đậm nét xuống mức tối thiểu (`rgba(var(--border), 0.3)`).
    *   **Gradient Fill cao cấp:** Áp dụng thẻ `<defs>` với `<linearGradient>` để biểu đồ vùng (Area Chart) có độ mờ nhạt dần từ trên xuống dưới một cách mượt mà (`opacity` từ `0.4` về `0`).
    *   **Glassmorphic Tooltip:** Tạo Custom Tooltip component với lớp phủ mờ kính (`backdrop-blur-md`), viền mỏng (`border border-white/10` hoặc `border-black/5`), chữ hiển thị rõ ràng và có đổ bóng mềm mại.

### 💎 Phase 3 — Thẻ Chỉ Số & Bộ Lọc Đẳng Cấp (Glass Cards & Styled Filters)
*   **Mục tiêu:** Thay thế các Stat Cards gradient thô bằng thẻ kính bán trong suốt, tạo các container đẹp mắt cho bộ lọc.
*   **Chi tiết thay đổi:**
    *   **Stat Cards:**
        *   Nền bán trong suốt `bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-zinc-800/50`.
        *   Tích hợp dải màu phát sáng tinh tế ở góc thẻ (subtle glow) tương ứng với loại chỉ số.
        *   Icon chỉ số nổi bật với vòng tròn nền mờ (`bg-[var(--accent-subtle)]`).
    *   **Bộ lọc Input:**
        *   Bọc các thẻ `<input>` vào một lớp chứa có thiết kế tùy chỉnh (Custom Styled wrapper). Tận dụng icon Lucide (`Calendar`, `Clock`, `Filter`) nằm góc trái input.
        *   Tùy chỉnh CSS cho date/month picker bằng cách ẩn nút mặc định của trình duyệt và thay bằng giao diện gọn gàng của hệ thống.

### 👥 Phase 4 — Cải Tiến Danh Sách User & Quản Lý Bài Viết
*   **Mục tiêu:** Cung cấp trải nghiệm quản trị tiện lợi, bố cục cân đối và dễ dàng đưa ra quyết định hành động nhanh.
*   **Chi tiết thay đổi trong** [viewusers/page.jsx](file:///home/thang/coding/social-network-ui/src/app/admin/dashboard/viewusers/page.jsx):
    *   **Bố cục Grid 2 cột hoặc Dạng Bảng (Table Grid Hybrid):**
        *   Thay vì kéo dài dọc, thông tin được tổ chức thành các nhóm nhỏ rõ ràng: `Thông tin cơ bản` (Avatar, Name, Email), `Chỉ số tương tác` (Friends, Posts, Messages), `Thông tin kỹ thuật` (Registration Date, Birthdate, Role).
        *   Bổ sung hiệu ứng Hover nổi bật nhẹ để admin dễ theo dõi.
    *   **Nâng cấp nút Action quản trị:**
        *   Các nút khóa/mở khóa (`Suspend`, `Unsuspend`) được đưa lên góc trên hoặc thanh tiêu đề của card để tối ưu diện tích. Sử dụng các thẻ badge màu sắc sang trọng để hiển thị trạng thái tài khoản (`Hoạt động`, `Đang bị khóa`).

---

## 🎨 Layout Thiết Kế Biểu Đồ & Thẻ Dự Kiến (Aesthetic Preview)

```
+-----------------------------------------------------------------------------------+
|  POCPOC ADMIN DASHBOARD   |  👤 Admin   |  🇻🇳 VI  |  ☀️ Light                         |
+---------------------------+-------------------------------------------------------+
|  [📊] Dashboard           |  HÔM NAY CÓ GÌ?                                       |
|  [👥] Quản lý Người Dùng  |  +--------------------+  +--------------------+       |
|  [📝] Quản lý Bài Viết    |  |  👥 NGƯỜI DÙNG     |  |  🟢 TRỰC TUYẾN     |       |
|                           |  |  12,840            |  |  842               |       |
|  [⚙️] Cài đặt             |  |  +142 tháng này    |  |  Chỉ số ổn định    |       |
|                           |  +--------------------+  +--------------------+       |
|                           |                                                       |
|  [🚪] Đăng xuất           |  BIỂU ĐỒ HOẠT ĐỘNG (Tuần này)     [ Lọc: Tuần 22 📅 ] |
|                           |  +-------------------------------------------------+  |
|                           |  |  *                                              |  |
|                           |  |  **      *                                      |  |
|                           |  |  ***    ***    *                                |  |
|                           |  |  ****  *****  ***   [ Electric Jade Area Fill ] |  |
|                           |  +-------------------------------------------------+  |
+---------------------------+-------------------------------------------------------+
```

---

## 🧪 Kế Hoạch Xác Minh (Verification Plan)

### 1. Xác minh kỹ thuật & Giao diện (Manual UI Inspection):
*   Kiểm tra độ phản hồi (Responsive Web Design) của Sidebar điều hướng mới trên cả màn hình Desktop và điện thoại thông minh (Mobile viewport).
*   Kiểm tra tính năng khóa/mở khóa tức thì (Optimistic UI updates) của danh sách User.
*   Xác minh sự chuyển đổi đồng bộ giữa giao diện Sáng/Tối (Light/Dark Theme) của các thẻ Glassmorphism và màu nền của Recharts Tooltip.

### 2. Xác minh hiệu năng (Performance Audit):
*   Đảm bảo việc tải trang Admin không bị giật lag khi chuyển đổi giữa bộ lọc biểu đồ bằng cách Memoize các biểu đồ Recharts nặng.
