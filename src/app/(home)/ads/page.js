"use client"

import { useState, useEffect } from "react"
import { BarChart3, PlusCircle, CheckCircle, Clock, XCircle, Play, Pause, FileText, Image as ImageIcon, Link as LinkIcon, DollarSign, Target, MousePointerClick, Eye, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import api from "@/utils/axios"

export default function AdvertiserPortal() {
	const [activeTab, setActiveTab] = useState("campaigns") // campaigns, create, analytics
	const [campaigns, setCampaigns] = useState([])
	const [loading, setLoading] = useState(true)

	// Form values for new campaign
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [mediaUrl, setMediaUrl] = useState("")
	const [targetUrl, setTargetUrl] = useState("")
	const [adType, setAdType] = useState("FEED_POST")
	const [targetGender, setTargetGender] = useState("ALL")
	const [targetMinAge, setTargetMinAge] = useState(18)
	const [targetMaxAge, setTargetMaxAge] = useState(65)
	const [budgetTotal, setBudgetTotal] = useState(50.00)
	const [bidType, setBidType] = useState("CPC")
	const [bidAmount, setBidAmount] = useState(0.20)
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [submitting, setSubmitting] = useState(false)

	const fetchCampaigns = async () => {
		try {
			const res = await api.get("/v1/ads/campaigns")
			if (res.data.code === 200) {
				setCampaigns(res.data.body || [])
			}
		} catch (err) {
			console.error("Failed to fetch advertiser campaigns:", err)
			toast.error("Không thể tải danh sách chiến dịch quảng cáo")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCampaigns()
	}, [])

	const handleCreateCampaign = async (e) => {
		e.preventDefault()

		if (!title.trim() || !targetUrl.trim()) {
			toast.error("Vui lòng điền các thông tin bắt buộc (Tiêu đề, Link đích)")
			return
		}

		if (!startDate || !endDate) {
			toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc")
			return
		}

		setSubmitting(true)
		try {
			const res = await api.post("/v1/ads/campaigns", {
				title: title.trim(),
				description: description.trim(),
				mediaUrl: mediaUrl.trim(),
				targetUrl: targetUrl.trim(),
				adType,
				targetGender,
				targetMinAge: parseInt(targetMinAge),
				targetMaxAge: parseInt(targetMaxAge),
				budgetTotal: parseFloat(budgetTotal),
				bidType,
				bidAmount: parseFloat(bidAmount),
				startDate: new Date(startDate).toISOString(),
				endDate: new Date(endDate).toISOString(),
			})

			if (res.data.code === 200) {
				toast.success("Đã gửi yêu cầu duyệt chiến dịch thành công!")
				// Reset form
				setTitle("")
				setDescription("")
				setMediaUrl("")
				setTargetUrl("")
				setStartDate("")
				setEndDate("")
				
				// Reload list & redirect
				fetchCampaigns()
				setActiveTab("campaigns")
			} else {
				toast.error("Tạo chiến dịch thất bại: " + res.data.message)
			}
		} catch (err) {
			console.error("Failed to create campaign:", err)
			toast.error("Lỗi khi tạo chiến dịch quảng cáo")
		} finally {
			setSubmitting(false)
		}
	}

	const toggleCampaignStatus = async (id, currentStatus) => {
		const targetStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
		try {
			const res = await api.put(`/v1/ads/campaigns/${id}/status`, {
				status: targetStatus
			})
			if (res.data.code === 200) {
				toast.success(`Đã cập nhật trạng thái chiến dịch thành ${targetStatus}`)
				fetchCampaigns()
			} else {
				toast.error("Cập nhật thất bại: " + res.data.message)
			}
		} catch (err) {
			console.error("Failed to toggle status:", err)
			toast.error("Không thể thay đổi trạng thái chiến dịch")
		}
	}

	// Calculate overall statistics
	const totalSpent = campaigns.reduce((acc, c) => acc + c.budgetSpent, 0)
	// Views and clicks statistics can be gathered if API support is expanded, otherwise we show general dashboard mockup
	const totalClicks = campaigns.length * 48 // Mock preview data
	const totalViews = campaigns.length * 1530 // Mock preview data
	const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00"

	const getStatusBadge = (status) => {
		switch (status) {
			case "ACTIVE":
				return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1 w-fit"><Play className="w-3 h-3" /> Đang chạy</span>
			case "PAUSED":
				return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20 flex items-center gap-1 w-fit"><Pause className="w-3 h-3" /> Tạm dừng</span>
			case "PENDING":
				return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Chờ duyệt</span>
			case "REJECTED":
				return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Từ chối</span>
			case "COMPLETED":
				return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Hoàn thành</span>
			default:
				return null
		}
	}

	return (
		<div className="w-full max-w-5xl mx-auto py-6 space-y-8 animate-fade-up">
			
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Advertiser Portal</h1>
					<p className="text-xs text-[var(--muted-foreground)]">Thiết lập chiến dịch quảng cáo và tiếp cận hàng nghìn khách hàng tiềm năng trên PocPoc.</p>
				</div>

				<div className="flex bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 gap-1">
					<button
						onClick={() => setActiveTab("campaigns")}
						className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "campaigns" ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
					>
						Chiến dịch của tôi
					</button>
					<button
						onClick={() => setActiveTab("create")}
						className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "create" ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
					>
						Tạo chiến dịch mới
					</button>
					<button
						onClick={() => setActiveTab("analytics")}
						className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "analytics" ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
					>
						Thống kê hiệu quả
					</button>
				</div>
			</div>

			{/* Tab 1: Campaigns list */}
			{activeTab === "campaigns" && (
				<div className="space-y-6">
					{loading ? (
						<div className="w-full flex justify-center py-20">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
						</div>
					) : campaigns.length === 0 ? (
						<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center flex flex-col items-center justify-center space-y-4">
							<div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
								<PlusCircle className="w-6 h-6" />
							</div>
							<div className="space-y-1">
								<h3 className="font-bold text-[var(--foreground)]">Chưa có chiến dịch quảng cáo nào</h3>
								<p className="text-xs text-[var(--muted-foreground)] max-w-sm">Tạo chiến dịch đầu tiên để hiển thị nội dung của bạn đến cộng đồng PocPoc.</p>
							</div>
							<button 
								onClick={() => setActiveTab("create")}
								className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold text-xs transition-colors hover:brightness-110 shadow-sm"
							>
								Tạo chiến dịch mới
							</button>
						</div>
					) : (
						<div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
							<table className="w-full border-collapse text-left text-sm">
								<thead>
									<tr className="border-b border-[var(--border)] bg-[var(--muted)]/35 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
										<th className="px-6 py-4">Chiến dịch</th>
										<th className="px-6 py-4">Trạng thái</th>
										<th className="px-6 py-4">Loại hình / Giá thầu</th>
										<th className="px-6 py-4">Ngân sách chiến dịch</th>
										<th className="px-6 py-4 text-right">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[var(--border)]">
									{campaigns.map((ad) => (
										<tr key={ad.id} className="hover:bg-[var(--muted)]/10 transition-colors">
											<td className="px-6 py-4">
												<div className="flex flex-col">
													<span className="font-bold text-[var(--foreground)]">{ad.title}</span>
													<a 
														href={ad.targetUrl} 
														target="_blank" 
														rel="noopener noreferrer" 
														className="text-xs text-[var(--accent)] hover:underline truncate max-w-xs mt-1"
													>
														{ad.targetUrl}
													</a>
												</div>
											</td>
											<td className="px-6 py-4">
												{getStatusBadge(ad.status)}
											</td>
											<td className="px-6 py-4">
												<div className="flex flex-col text-xs text-[var(--foreground)]">
													<span className="font-semibold">{ad.adType}</span>
													<span className="text-[var(--muted-foreground)] mt-0.5">${ad.bidAmount.toFixed(2)} ({ad.bidType})</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex flex-col w-32 space-y-1.5">
													<div className="flex justify-between text-xs font-semibold">
														<span className="text-[var(--foreground)]">${ad.budgetSpent.toFixed(2)}</span>
														<span className="text-[var(--muted-foreground)]">/ ${ad.budgetTotal.toFixed(2)}</span>
													</div>
													<div className="w-full bg-[var(--muted)] rounded-full h-1.5">
														<div 
															className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-300"
															style={{ width: `${Math.min(100, (ad.budgetSpent / ad.budgetTotal) * 100)}%` }}
														></div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 text-right">
												{(ad.status === "ACTIVE" || ad.status === "PAUSED") && (
													<button
														onClick={() => toggleCampaignStatus(ad.id, ad.status)}
														className={`p-2 rounded-xl border border-[var(--border)] transition-colors hover:bg-[var(--muted)] ${ad.status === "ACTIVE" ? "text-amber-500" : "text-green-500"}`}
														title={ad.status === "ACTIVE" ? "Tạm dừng chiến dịch" : "Chạy tiếp chiến dịch"}
													>
														{ad.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Tab 2: Create Campaign Form with Live Preview */}
			{activeTab === "create" && (
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					
					{/* Left: Input Form */}
					<form onSubmit={handleCreateCampaign} className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-6">
						<div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
							<Sparkles className="w-5 h-5 text-[var(--accent)]" />
							<h2 className="text-lg font-bold text-[var(--foreground)]">Cấu hình thông tin Quảng cáo</h2>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<div>
								<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Tiêu đề quảng cáo *</label>
								<div className="relative">
									<input
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Ví dụ: Giảm giá 50% toàn bộ sản phẩm"
										className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Mô tả chi tiết</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Nhập nội dung quảng cáo ngắn để thu hút người dùng..."
									className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] h-24 resize-none"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Đường dẫn Banner (Media URL)</label>
									<div className="relative">
										<ImageIcon className="absolute left-3 top-3 w-4 h-4 text-[var(--muted-foreground)]" />
										<input
											type="url"
											value={mediaUrl}
											onChange={(e) => setMediaUrl(e.target.value)}
											placeholder="https://images.unsplash.com/..."
											className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
										/>
									</div>
								</div>
								<div>
									<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Liên kết đích (Target URL) *</label>
									<div className="relative">
										<LinkIcon className="absolute left-3 top-3 w-4 h-4 text-[var(--muted-foreground)]" />
										<input
											type="url"
											value={targetUrl}
											onChange={(e) => setTargetUrl(e.target.value)}
											placeholder="https://mywebsite.com/promotion"
											className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
											required
										/>
									</div>
								</div>
							</div>

							{/* Targeting Segment */}
							<div className="border-t border-[var(--border)] pt-4 space-y-4">
								<h3 className="text-sm font-bold text-[var(--foreground)]">Cấu hình đối tượng mục tiêu (Targeting)</h3>
								
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Giới tính</label>
										<select
											value={targetGender}
											onChange={(e) => setTargetGender(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
										>
											<option value="ALL">Tất cả</option>
											<option value="MALE">Nam</option>
											<option value="FEMALE">Nữ</option>
										</select>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Độ tuổi tối thiểu</label>
										<input
											type="number"
											value={targetMinAge}
											onChange={(e) => setTargetMinAge(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
											min="0"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Độ tuổi tối đa</label>
										<input
											type="number"
											value={targetMaxAge}
											onChange={(e) => setTargetMaxAge(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
											max="100"
										/>
									</div>
								</div>
							</div>

							{/* Financials & Bid */}
							<div className="border-t border-[var(--border)] pt-4 space-y-4">
								<h3 className="text-sm font-bold text-[var(--foreground)]">Ngân sách & Giá đấu thầu</h3>
								
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Hình thức đấu thầu</label>
										<select
											value={bidType}
											onChange={(e) => setBidType(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
										>
											<option value="CPC">CPC (Tính phí theo Click)</option>
											<option value="CPM">CPM (Tính phí theo 1000 View)</option>
										</select>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Giá thầu thầu ($) *</label>
										<input
											type="number"
											step="0.01"
											value={bidAmount}
											onChange={(e) => setBidAmount(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
											min="0.01"
											required
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Tổng ngân sách ($) *</label>
										<input
											type="number"
											step="1"
											value={budgetTotal}
											onChange={(e) => setBudgetTotal(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
											min="10"
											required
										/>
									</div>
								</div>
							</div>

							{/* Schedule */}
							<div className="border-t border-[var(--border)] pt-4 space-y-4">
								<h3 className="text-sm font-bold text-[var(--foreground)]">Thời gian triển khai</h3>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Ngày bắt đầu *</label>
										<input
											type="datetime-local"
											value={startDate}
											onChange={(e) => setStartDate(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
											required
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Ngày kết thúc *</label>
										<input
											type="datetime-local"
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
											className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
											required
										/>
									</div>
								</div>
							</div>

						</div>

						<button
							type="submit"
							disabled={submitting}
							className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold text-sm transition-all hover:brightness-110 shadow-md flex items-center justify-center gap-2"
						>
							{submitting ? (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							) : (
								<>Gửi yêu cầu phê duyệt chiến dịch</>
							)}
						</button>
					</form>

					{/* Right: Live Preview Panel */}
					<div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
						<h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase">Preview Quảng cáo (Realtime)</h3>
						
						{/* Newsfeed post layout preview */}
						<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm space-y-4">
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center border border-[var(--border)] text-xs font-bold text-[var(--muted-foreground)]">
									AD
								</div>
								<div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-bold text-[var(--foreground)]">PocPoc Sponsored Partner</span>
										<span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[var(--accent-subtle)] text-[var(--accent)] uppercase">Ad</span>
									</div>
									<p className="text-[10px] text-[var(--muted-foreground)]">Được tài trợ (Sponsored)</p>
								</div>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[var(--foreground)] leading-snug">
									{title || "Tiêu đề mẫu cho chiến dịch của bạn..."}
								</h4>
								<p className="text-xs text-[var(--muted-foreground)] leading-normal line-clamp-3">
									{description || "Mô tả chi tiết chương trình khuyến mại, giới thiệu sản phẩm của bạn tại đây để cuốn hút lượt Click từ cộng đồng."}
								</p>
							</div>

							{mediaUrl ? (
								<div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black/5 aspect-[16/9] relative">
									<img 
										src={mediaUrl} 
										alt="Ad media banner" 
										className="w-full h-full object-cover"
										onError={(e) => {
											e.target.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=600"
										}}
									/>
								</div>
							) : (
								<div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/20 aspect-[16/9] flex flex-col items-center justify-center text-[var(--muted-foreground)] gap-2">
									<ImageIcon className="w-8 h-8 opacity-40" />
									<span className="text-[10px]">Chưa nhập Media URL banner quảng cáo</span>
								</div>
							)}

							<div className="flex justify-between items-center bg-[var(--muted)]/40 p-3 rounded-xl border border-[var(--border)]">
								<div className="space-y-0.5 overflow-hidden pr-2">
									<p className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Ghé thăm trang web</p>
									<p className="text-xs font-bold text-[var(--foreground)] truncate">{targetUrl || "https://example.com"}</p>
								</div>
								<a
									href={targetUrl || "#"}
									target="_blank"
									rel="noopener noreferrer"
									className="px-3.5 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-bold transition-transform hover:scale-105 shadow-sm inline-block"
									onClick={(e) => e.preventDefault()}
								>
									Tìm hiểu thêm
								</a>
							</div>
						</div>
					</div>

				</div>
			)}

			{/* Tab 3: Performance Analytics Mocked dashboard summary */}
			{activeTab === "analytics" && (
				<div className="space-y-8">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Chi tiêu lũy kế</p>
								<p className="text-2xl font-bold text-[var(--foreground)]">${totalSpent.toFixed(2)}</p>
							</div>
							<div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
								<DollarSign className="w-6 h-6" />
							</div>
						</div>

						<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Lượt nhấp chuột (Clicks)</p>
								<p className="text-2xl font-bold text-[var(--foreground)]">{totalClicks}</p>
							</div>
							<div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
								<MousePointerClick className="w-6 h-6" />
							</div>
						</div>

						<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Lượt hiển thị (Views)</p>
								<p className="text-2xl font-bold text-[var(--foreground)]">{totalViews}</p>
							</div>
							<div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
								<Eye className="w-6 h-6" />
							</div>
						</div>

						<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Tỉ lệ CTR</p>
								<p className="text-2xl font-bold text-[var(--foreground)]">{ctr}%</p>
							</div>
							<div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
								<Target className="w-6 h-6" />
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
						<h3 className="font-bold text-[var(--foreground)]">Hướng dẫn chạy quảng cáo</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
							<div className="space-y-2 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
								<span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">1</span>
								<h4 className="font-bold text-[var(--foreground)]">Tạo chiến dịch</h4>
								<p className="text-xs text-[var(--muted-foreground)]">Thiết lập tiêu đề, tải lên hình ảnh banner thu hút và gán link sản phẩm của bạn.</p>
							</div>
							<div className="space-y-2 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
								<span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">2</span>
								<h4 className="font-bold text-[var(--foreground)]">Chờ phê duyệt</h4>
								<p className="text-xs text-[var(--muted-foreground)]">Ban quản trị PocPoc sẽ xét duyệt tính hợp pháp của nội dung trong vòng 24h.</p>
							</div>
							<div className="space-y-2 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
								<span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">3</span>
								<h4 className="font-bold text-[var(--foreground)]">Theo dõi hiệu quả</h4>
								<p className="text-xs text-[var(--muted-foreground)]">Xem số liệu phân tích trực quan về lượt xem, lượt click chuột để cải tiến nội dung.</p>
							</div>
						</div>
					</div>
				</div>
			)}

		</div>
	)
}
