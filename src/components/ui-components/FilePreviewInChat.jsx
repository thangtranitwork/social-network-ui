import { X, FileText, Image, Film, Music } from "lucide-react";

const getFileIcon = (fileType) => {
  if (!fileType) return <FileText className="w-8 h-8" />;
  if (fileType.startsWith('image/')) return <Image className="w-8 h-8" />;
  if (fileType.startsWith('video/')) return <Film className="w-8 h-8" />;
  if (fileType.startsWith('audio/')) return <Music className="w-8 h-8" />;
  return <FileText className="w-8 h-8" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FilePreviewInChat({ 
  selectedFile, 
  filePreview, 
  onCancel 
}) {
  if (!selectedFile) return null;

  return (
    <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--muted)] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">File được chọn:</span>
        <button
          onClick={onCancel}
          className="text-[var(--muted-foreground)] hover:text-red-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg">
        <div className="text-[var(--muted-foreground)]">
          {getFileIcon(selectedFile.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{selectedFile.name}</div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {formatFileSize(selectedFile.size)}
          </div>
        </div>

        {filePreview && (
          <div className="flex-shrink-0">
            <img 
              src={filePreview} 
              alt="Preview" 
              className="w-12 h-12 object-cover rounded border"
            />
          </div>
        )}
      </div>
    </div>
  );
}