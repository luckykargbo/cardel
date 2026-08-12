'use strict';
/**
 * SALONEAUTOLINK — CLOUD STORAGE & MEDIA PROCESSING SERVICE
 * Handles image optimization (sharp -> WebP @ 80% quality, max width 1920px),
 * direct upload to Cloudflare R2 / AWS S3 via @aws-sdk/client-s3,
 * and bucket file deletion.
 */

let S3Client = null, PutObjectCommand = null, DeleteObjectCommand = null, DeleteObjectsCommand = null;
let s3ClientInstance = null;

function getS3Client() {
  if (s3ClientInstance !== null) return s3ClientInstance;
  const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || undefined;
  const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || undefined;
  if (!ACCESS_KEY || !SECRET_KEY) {
    s3ClientInstance = false;
    return false;
  }
  try {
    const s3Sdk = require('@aws-sdk/client-s3');
    S3Client = s3Sdk.S3Client;
    PutObjectCommand = s3Sdk.PutObjectCommand;
    DeleteObjectCommand = s3Sdk.DeleteObjectCommand;
    DeleteObjectsCommand = s3Sdk.DeleteObjectsCommand;
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
    const REGION      = process.env.S3_REGION || 'auto';
    const ENDPOINT    = process.env.S3_ENDPOINT || undefined;
    const s3Config = { region: REGION, credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY } };
    if (ENDPOINT) s3Config.endpoint = ENDPOINT;
    s3ClientInstance = new S3Client(s3Config);
  } catch (err) {
    console.warn('S3 SDK load note:', err.message);
    s3ClientInstance = false;
  }
  return s3ClientInstance;
}

/**
 * Format the public URL string for a key in Cloud Storage
 */
function getPublicUrl(key) {
  if (URL_PREFIX) {
    return `${URL_PREFIX}/${key}`;
  }
  if (ENDPOINT) {
    return `${ENDPOINT.replace(/\/+$/, '')}/${BUCKET_NAME}/${key}`;
  }
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Extract S3 object key from a full public URL string
 */
function extractKeyFromUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return null;
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    try {
      const u = new URL(urlStr);
      let p = u.pathname.replace(/^\/+/, '');
      // If endpoint pathname includes bucket name prefix
      if (p.startsWith(`${BUCKET_NAME}/`)) {
        p = p.substring(BUCKET_NAME.length + 1);
      }
      return p;
    } catch {
      return null;
    }
  }
  // If it's a relative path or key
  return urlStr.replace(/^\/+/, '');
}

/**
 * Process image buffer: resize width <= 1920px, convert to WebP @ 80% quality, and upload to S3/R2.
 * @param {Buffer} fileBuffer 
 * @param {string} originalFilename 
 * @returns {Promise<string>} Public URL string
 */
async function processAndUploadImage(fileBuffer, originalFilename = '') {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer provided for image processing.');
  }

  let optimizedBuffer = fileBuffer;
  let contentType = 'image/jpeg';

  const sharpInstance = getSharp();
  if (sharpInstance) {
    try {
      optimizedBuffer = await sharpInstance(fileBuffer)
        .resize({ width: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      contentType = 'image/webp';
    } catch (err) {
      console.warn('Sharp optimization fallback:', err.message);
      optimizedBuffer = fileBuffer;
    }
  }

  const ext = contentType === 'image/webp' ? '.webp' : (path.extname(originalFilename) || '.jpg');
  const key = `cars/img-${uuidv4()}${ext}`;

  const client = getS3Client();
  if (client) {
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
    await client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: contentType,
    }));
  } else {
    console.warn(`[CloudStorage] S3 credentials not set. Simulated upload for key: ${key}`);
  }

  return getPublicUrl(key);
}

/**
 * Upload video buffer (max 15MB) to S3/R2.
 * @param {Buffer} fileBuffer 
 * @param {string} originalFilename 
 * @param {string} mimeType 
 * @returns {Promise<string>} Public URL string
 */
async function uploadVideo(fileBuffer, originalFilename = '', mimeType = 'video/mp4') {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer provided for video upload.');
  }

  const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15 MB limit
  if (fileBuffer.length > MAX_VIDEO_SIZE) {
    throw new Error('Video file exceeds the 15 MB maximum size limit.');
  }

  const ext = (path.extname(originalFilename) || '.mp4').toLowerCase();
  const key = `cars/video-${uuidv4()}${ext}`;

  const client = getS3Client();
  if (client) {
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
    await client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType || 'video/mp4',
    }));
  } else {
    console.warn(`[CloudStorage] S3 credentials not set. Simulated video upload for key: ${key}`);
  }

  return getPublicUrl(key);
}

/**
 * Delete associated media from Cloud Storage by URL or array of URLs.
 * @param {string|string[]} fileUrlOrUrls 
 */
async function deleteCloudMedia(fileUrlOrUrls) {
  if (!fileUrlOrUrls) return;
  const urls = Array.isArray(fileUrlOrUrls) ? fileUrlOrUrls : [fileUrlOrUrls];
  const keys = urls.map(extractKeyFromUrl).filter(Boolean);

  if (!keys.length) return;

  const client = getS3Client();
  if (!client) {
    console.warn(`[CloudStorage] S3 credentials not set. Simulated deletion for keys:`, keys);
    return;
  }

  try {
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
    if (keys.length === 1) {
      await client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: keys[0],
      }));
    } else {
      await client.send(new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: keys.map(k => ({ Key: k })),
          Quiet: true,
        },
      }));
    }
  } catch (err) {
    console.error('Failed to delete media from Cloud Storage:', err);
  }
}

module.exports = {
  processAndUploadImage,
  uploadVideo,
  deleteCloudMedia,
  getPublicUrl,
  extractKeyFromUrl,
};
