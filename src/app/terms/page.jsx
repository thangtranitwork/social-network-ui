'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import ThemeToggle from '@/components/ui-components/Themetoggle';
import LanguageSwitcher from '@/components/ui-components/LanguageSwitcher';
import { FileText, ArrowLeft, Shield, MapPin, UserCheck, AlertTriangle, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
  const locale = useLocale();
  const isVi = locale === 'vi';

  const sections = isVi
    ? [
        {
          id: 'acceptance',
          num: '01',
          icon: FileText,
          title: '1. Chấp nhận điều khoản & Điều kiện sử dụng',
          paragraphs: [
            'Bằng việc đăng ký tài khoản hoặc sử dụng PocPoc, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ Điều khoản sử dụng này cùng Chính sách quyền riêng tư của chúng tôi.',
            'Người dùng phải đủ từ 16 tuổi trở lên (hoặc độ tuổi tối thiểu hợp pháp tại quốc gia cư trú) để tạo tài khoản và sử dụng các tính năng tương tác cộng đồng.'
          ]
        },
        {
          id: 'conduct',
          num: '02',
          icon: AlertTriangle,
          title: '2. Quy tắc ứng xử & Nội dung bị cấm',
          paragraphs: [
            'Bạn chịu trách nhiệm hoàn toàn đối với nội dung mình đăng tải, chia sẻ hoặc nhắn tin trên nền tảng. Nghiêm cấm đăng tải nội dung vi phạm pháp luật, quấy rối, đe dọa, xâm phạm đời tư hoặc giả mạo danh tính người khác.',
            'Nghiêm cấm sử dụng công cụ tự động, giả mạo tọa độ GPS (GPS spoofing), thu thập dữ liệu trái phép (scraping) hoặc lợi dụng tính năng Người quanh đây để theo dõi, làm phiền người dùng khác.'
          ]
        },
        {
          id: 'location-terms',
          num: '03',
          icon: MapPin,
          title: '3. Điều khoản về Vị trí (GPS), IP & Thiết bị',
          paragraphs: [
            'Khi bạn bật tính năng Người quanh đây hoặc cấp quyền truy cập vị trí, bạn đồng ý cho phép hệ thống xử lý tọa độ tạm thời trên bộ nhớ đệm để hiển thị người dùng lân cận (dưới dạng khoảng cách ước lượng đã làm tròn).',
            'Bạn có toàn quyền tắt hiển thị bất kỳ lúc nào trong Cài đặt quyền riêng tư hoặc ngay trên màn hình Người quanh đây. Thông tin IP, thiết bị và nhật ký vị trí kỹ thuật được lưu trữ theo thời hạn quy định trong Chính sách quyền riêng tư để bảo vệ tài khoản và vận hành hệ thống.'
          ]
        },
        {
          id: 'third-party-maps',
          num: '04',
          icon: Shield,
          title: '4. Dịch vụ bản đồ bên thứ ba',
          paragraphs: [
            'Giao diện bản đồ trên PocPoc có thể sử dụng dữ liệu hiển thị từ OpenStreetMap, Carto hoặc Google Maps tùy theo cấu hình hệ thống. Khi sử dụng tính năng bản đồ, bạn đồng thời tuân thủ điều khoản sử dụng hiện hành của nhà cung cấp dữ liệu bản đồ tương ứng.'
          ]
        },
        {
          id: 'termination',
          num: '05',
          icon: UserCheck,
          title: '5. Tạm khóa & Chấm dứt tài khoản',
          paragraphs: [
            'PocPoc có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện hành vi vi phạm điều khoản, lạm dụng hệ thống hoặc gây mất an toàn cho cộng đồng.',
            'Bạn có thể ngừng sử dụng dịch vụ hoặc yêu cầu xóa tài khoản bất kỳ lúc nào. Liên hệ hỗ trợ pháp lý: privacy@pocpoc.online.'
          ]
        }
      ]
    : [
        {
          id: 'acceptance',
          num: '01',
          icon: FileText,
          title: '1. Acceptance of Terms & Eligibility',
          paragraphs: [
            'By creating an account or using PocPoc, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.',
            'You must be at least 16 years old (or the minimum legal age in your jurisdiction) to register and use community features.'
          ]
        },
        {
          id: 'conduct',
          num: '02',
          icon: AlertTriangle,
          title: '2. Acceptable Use & Prohibited Conduct',
          paragraphs: [
            'You are solely responsible for content you post, share, or transmit. Harassment, hate speech, impersonation, doxxing, and unlawful content are strictly prohibited.',
            'Automated scraping, GPS spoofing, or abusing the People Nearby feature to stalk or harass other users is strictly forbidden and will result in immediate account suspension.'
          ]
        },
        {
          id: 'location-terms',
          num: '03',
          icon: MapPin,
          title: '3. Location (GPS), IP & Device Telemetry Terms',
          paragraphs: [
            'When you opt into People Nearby or grant location permissions, you authorize PocPoc to process temporary location coordinates in memory to display nearby users using rounded distance estimates.',
            'You may disable People Nearby visibility anytime in Privacy Settings or directly on the Nearby screen. Technical IP, device, and location telemetry logs are retained as described in our Privacy Policy for security and service analytics.'
          ]
        },
        {
          id: 'third-party-maps',
          num: '04',
          icon: Shield,
          title: '4. Third-Party Map Providers',
          paragraphs: [
            'Map visualizations on PocPoc may render tiles from OpenStreetMap, Carto, or Google Maps depending on active system configuration. Your use of map views is also subject to the applicable terms of the active map provider.'
          ]
        },
        {
          id: 'termination',
          num: '05',
          icon: UserCheck,
          title: '5. Suspension & Account Termination',
          paragraphs: [
            'PocPoc reserves the right to suspend or terminate accounts that violate these terms, abuse platform APIs, or compromise user safety.',
            'You may stop using the service or request account deletion anytime. For legal or privacy inquiries, contact privacy@pocpoc.online.'
          ]
        }
      ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft className="w-4 h-4" />
            <span>{isVi ? 'Về trang chủ' : 'Back to Home'}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="text-sm font-medium text-[var(--accent)] hover:underline">
              {isVi ? 'Chính sách quyền riêng tư' : 'Privacy Policy'}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3 border-b border-[var(--border)] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>{isVi ? 'Điều khoản sử dụng' : 'Terms of Service'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {isVi ? 'Điều khoản sử dụng dịch vụ PocPoc' : 'PocPoc Terms of Service'}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {isVi ? 'Cập nhật ngày 16 tháng 11, 2026' : 'Last updated November 16, 2026'}
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                </div>
                <div className="space-y-2.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)]">
            <Mail className="w-4 h-4 text-[var(--accent)]" />
            <span>privacy@pocpoc.online</span>
          </div>
          <Link href="/settings/privacy" className="text-sm font-medium text-[var(--accent)] hover:underline">
            {isVi ? 'Quản lý cài đặt quyền riêng tư & vị trí →' : 'Manage privacy & location settings →'}
          </Link>
        </div>
      </main>
    </div>
  );
}
