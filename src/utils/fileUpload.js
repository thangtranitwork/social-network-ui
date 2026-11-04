import api from './axios';
import axios from 'axios';

/**
 * Uploads a file using a presigned URL.
 * 1. Requests a presigned URL from the file-service.
 * 2. Uploads the file directly to the storage provider (Minio).
 * 
 * @param {File} file - The file object to upload.
 * @param {Function} [onProgress] - Optional callback receiving progress percentage (0 - 100).
 * @returns {Promise<string>} - The file ID.
 */
export const uploadFile = async (file, onProgress) => {
  if (!file) return null;

  try {
    // 1. Get presigned URL
    // The endpoint matches the route in API Gateway
    const response = await api.get('/v1/files/upload/presigned', {
      params: {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
      }
    });

    const { id, url } = response.data.body || response.data;

    if (!url) {
      throw new Error('Failed to get presigned URL');
    }

    // 2. Upload to presigned URL directly using axios (avoiding API gateway for the actual upload)
    await axios.put(url, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent, progressEvent.loaded, progressEvent.total);
        }
      }
    });

    if (onProgress) onProgress(100);
    return id;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Uploads multiple files with progress tracking.
 * 
 * @param {FileList|File[]} files - The files to upload.
 * @param {Function} [onProgress] - Optional callback receiving { percent, completedCount, totalCount }.
 * @returns {Promise<string[]>} - Array of file IDs.
 */
export const uploadMultipleFiles = async (files, onProgress) => {
  if (!files || files.length === 0) return [];
  
  const filesArray = Array.from(files);
  const total = filesArray.length;
  const progressMap = new Array(total).fill(0);

  const notify = () => {
    if (!onProgress) return;
    const totalPercent = Math.round(
      progressMap.reduce((sum, p) => sum + p, 0) / total
    );
    const completedCount = progressMap.filter((p) => p === 100).length;
    onProgress({
      percent: totalPercent,
      completedCount,
      totalCount: total,
    });
  };

  const uploadPromises = filesArray.map((file, index) =>
    uploadFile(file, (filePercent) => {
      progressMap[index] = filePercent;
      notify();
    })
  );
  
  return Promise.all(uploadPromises);
};
