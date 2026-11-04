/**
 * Trích xuất danh sách File (ảnh, video, tài liệu) từ sự kiện onPaste của clipboard.
 * Hỗ trợ:
 * - Copy file từ File Explorer / Finder (clipboardData.files)
 * - Chụp màn hình (Snipping Tool, PrtScn, Cmd+Shift+4) (clipboardData.items)
 * - Copy ảnh từ trình duyệt web (Right-click -> Copy Image)
 * 
 * @param {ClipboardEvent} e Sự kiện onPaste của DOM/React
 * @param {Object} options Tùy chọn lọc
 * @param {boolean} [options.imageOnly=false] Chỉ lấy file ảnh
 * @returns {File[]} Danh sách các file hợp lệ
 */
export const extractFilesFromClipboard = (e, { imageOnly = false } = {}) => {
  const clipboardData = e?.clipboardData;
  if (!clipboardData) return [];

  const files = [];

  // 1. Kiểm tra clipboardData.files (khi copy file từ hệ điều hành)
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (!imageOnly || file.type.startsWith("image/")) {
        files.push(file);
      }
    }
  }

  // 2. Kiểm tra clipboardData.items (cho ảnh chụp màn hình / clipboard binary)
  if (files.length === 0 && clipboardData.items) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.kind === "file" || item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file && (!imageOnly || file.type.startsWith("image/"))) {
          files.push(file);
        }
      }
    }
  }

  // Deduplicate files by name and size to prevent any ghost duplicate from clipboard events
  const uniqueFiles = [];
  const seen = new Set();
  for (const f of files) {
    const key = `${f.name}-${f.size}-${f.lastModified}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFiles.push(f);
    }
  }

  return uniqueFiles;
};

export default extractFilesFromClipboard;
