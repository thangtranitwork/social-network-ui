import api from './axios';
import axios from 'axios';

/**
 * Uploads a file using a presigned URL.
 * 1. Requests a presigned URL from the file-service.
 * 2. Uploads the file directly to the storage provider (Minio).
 * 
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} - The file ID.
 */
export const uploadFile = async (file) => {
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
      }
    });

    return id;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Uploads multiple files.
 * 
 * @param {FileList|File[]} files - The files to upload.
 * @returns {Promise<string[]>} - Array of file IDs.
 */
export const uploadMultipleFiles = async (files) => {
  if (!files || files.length === 0) return [];
  
  const filesArray = Array.from(files);
  const uploadPromises = filesArray.map(file => uploadFile(file));
  
  return Promise.all(uploadPromises);
};
