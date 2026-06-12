"use client"

import { useState, useEffect } from "react"
import { BarChart3, CheckCircle, XCircle, Eye, DollarSign, Target, MousePointerClick, RefreshCw, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import adminApi from "@/utils/adminInterception"

export default function AdminAdsPage() {
	const [pendingAds, setPendingAds] = useState([])
	const [statistics, setStatistics] = useState({
		totalCampaigns: 0,
		activeCampaigns: 0,
		totalRevenue: 0.0,
		totalViews: 0,
		totalClicks: 0,
	})
	const [loading, setLoading] = useState(true)
	const [actionLoading, setActionLoading] = useState(null)

	const fetchAllData = async () => {
		try {
			// Fetch stats
			const statsRes = await adminApi.get("/v2/statistics/ads")
			if (statsRes.data.code === 200 && statsRes.data.body) {
				setStatistics(statsRes.data.body)
			}

			// Fetch pending
			const pendingRes = await adminApi.get("/v1/admin/ads/pending")
			if (pendingRes.data.code === 200 && pendingRes.data.body) {
				setPendingAds(pendingRes.data.body || [])
			}
		} catch (err) {
			console.error("Failed to fetch admin ads data:", err)
			toast.error("Không thể tải thông tin quảng cáo từ máy chủ")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAllData()
	}, [])

	const handleApprove = async (id) => {
		setActionLoading(id)
		try {
			const res = await adminApi.post(`/v1/admin/ads/${id}/approve`)
			if (res.data.code === 200) {
				toast.success("Chiến dịch quảng cáo đã được kích hoạt thành công!")
				fetchAllData()
			} else {
				toast.error("Phê duyệt thất bại: " + res.data.message)
			}
		} catch (err) {
			console.error("Approve failed:", err)
			toast.error("Lỗi khi duyệt chiến dịch")
		} finally {
			setActionLoading(null)
		}
	}

	const handleReject = async (id) => {
		setActionLoading(id)
		try {
			const res = await adminApi.post(`/v1/admin/ads/${id}/reject`)
			if (res.data.code === 200) {
				toast.success("Đã từ chối chiến dịch quảng cáo!")
				fetchAllData()
			} else {
				toast.error("Từ chối thất bại: " + res.data.message)
			}
		} catch (err) {
			console.error("Reject failed:", err)
			toast.error("Lỗi khi từ chối chiến dịch")
		} finally {
			setActionLoading(null)
		}
	}

	const ctr = statistics.totalViews > 0 
		? ((statistics.totalClicks / statistics.totalViews) * 100).toFixed(2) 
		: "0.00"

	if (loading) {
		return (
			<div className="w-full flex justify-center items-center py-20">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
				<span className="ml-2 text-[var(--muted-foreground)]">Đang tải dữ liệu quảng cáo...</span>
			</div>
		)
	}

	return (
		<div className="space-y-8 animate-fade-up">
			
			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				
				<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Tổng Doanh Thu</p>
						<p className="text-2xl font-bold text-[var(--foreground)]">${statistics.totalRevenue.toFixed(2)}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
						<DollarSign className="w-6 h-6" />
					</div>
				</div>

				<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Số Lượt Click</p>
						<p className="text-2xl font-bold text-[var(--foreground)]">{statistics.totalClicks.toLocaleString()}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
						<MousePointerClick className="w-6 h-6" />
					</div>
				</div>

				<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Số Lượt Hiển Thị</p>
						<p className="text-2xl font-bold text-[var(--foreground)]">{statistics.totalViews.toLocaleString()}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
						<Eye className="w-6 h-6" />
					</div>
				</div>

				<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">CTR Trung Bình</p>
						<p className="text-2xl font-bold text-[var(--foreground)]">{ctr}%</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
						<Target className="w-6 h-6" />
					</div>
				</div>

			</div>

			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
					<BarChart3 className="w-5 h-5 text-[var(--accent)]" />
					Yêu cầu duyệt chiến dịch ({pendingAds.length})
				</h2>
				<button 
					onClick={fetchAllData} 
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-xs transition-colors"
				>
					<RefreshCw className="w-3.5 h-3.5" />
					Tải lại danh sách
				</button>
			</div>

			{/* Pending Ads List */}
			{pendingAds.length === 0 ? (
				<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center flex flex-col items-center justify-center space-y-4">
					<div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
						<AlertCircle className="w-6 h-6" />
					</div>
					<div className="space-y-1">
						<h3 className="font-bold text-[var(--foreground)]">Không có quảng cáo chờ duyệt</h3>
						<p className="text-xs text-[var(--muted-foreground)] max-w-sm">Tất cả chiến dịch quảng cáo đã được xử lý hoặc chưa có yêu cầu mới.</p>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{pendingAds.map((ad) => (
						<div key={ad.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between space-y-6">
							
							<div className="space-y-4">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="font-bold text-[var(--foreground)] leading-tight">{ad.title}</h3>
										<p className="text-xs text-[var(--muted-foreground)] mt-1">Được tạo bởi: <span className="font-semibold">{ad.advertiserId}</span></p>
									</div>
									<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
										{ad.adType}
									</span>
								</div>

								{ad.description && (
									<p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/30 p-3 rounded-xl border border-[var(--border)]">
										{ad.description}
									</p>
								)}

								{/* Targeting info */}
								<div className="grid grid-cols-2 gap-4 text-xs border-y border-[var(--border)] py-3">
									<div>
										<p className="text-[var(--muted-foreground)]">Đối tượng giới tính:</p>
										<p className="font-semibold mt-0.5 text-[var(--foreground)]">{ad.targetGender}</p>
									</div>
									<div>
										<p className="text-[var(--muted-foreground)]">Độ tuổi mục tiêu:</p>
										<p className="font-semibold mt-0.5 text-[var(--foreground)]">{ad.targetMinAge} - {ad.targetMaxAge} tuổi</p>
									</div>
									<div>
										<p className="text-[var(--muted-foreground)]">Ngân sách chiến dịch:</p>
										<p className="font-semibold mt-0.5 text-[var(--foreground)]">${ad.budgetTotal.toFixed(2)}</p>
									</div>
									<div>
										<p className="text-[var(--muted-foreground)]">Giá đấu thầu ({ad.bidType}):</p>
										<p className="font-semibold mt-0.5 text-[var(--foreground)]">${ad.bidAmount.toFixed(2)}</p>
									</div>
								</div>

								{/* Image preview */}
								{ad.mediaUrl && (
									<div className="space-y-1.5">
										<p className="text-xs text-[var(--muted-foreground)]">Ảnh quảng cáo banner:</p>
										<div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-black/5 aspect-[16/9]">
											<img 
												src={ad.mediaUrl} 
												alt={ad.title} 
												className="w-full h-full object-cover"
												onError={(e) => {
													e.target.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=600"
												}}
											/>
										</div>
									</div>
								)}

								<div className="text-xs text-[var(--muted-foreground)]">
									<p>Link đích quảng cáo: <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline font-semibold">{ad.targetUrl}</a></p>
									<p className="mt-1">Thời gian chạy: {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}</p>
								</div>
							</div>

							<div className="flex gap-3 pt-4 border-t border-[var(--border)]">
								<button
									onClick={() => handleReject(ad.id)}
									disabled={actionLoading === ad.id}
									className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold text-xs transition-colors"
								>
									<XCircle className="w-4 h-4" />
									Từ chối
								</button>
								<button
									onClick={() => handleApprove(ad.id)}
									disabled={actionLoading === ad.id}
									className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-xs transition-colors shadow-sm hover:brightness-110"
								>
									<CheckCircle className="w-4 h-4" />
									Duyệt chiến dịch
								</button>
							</div>

						</div>
					))}
				</div>
			)}

		</div>
	)
}
