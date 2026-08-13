'use strict';
/**
 * SALONEAUTOLINK — CLOUD STORAGE & MEDIA PROCESSING SERVICE
 * Handles image optimization, direct upload to Cloudflare R2 / AWS S3 via @aws-sdk/client-s3,
 * and bucket file deletion.
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
  const URL_PREFIX  = process.env.S3_URL_PREFIX || undefined;
  const ENDPOINT    = process.env.S3_ENDPOINT || undefined;
  const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
  const REGION      = process.env.S3_REGION || 'auto';

  if (URL_PREFIX) {
    return `${URL_PREFIX}/${key}`;
  }
  if (ENDPOINT) {
    return `${ENDPOINT.replace(/\/+$/, '')}/${BUCKET_NAME}/${key}`;
  }
  const s3Region = (!REGION || REGION === 'auto') ? 'us-east-1' : REGION;
  return `https://${BUCKET_NAME}.s3.${s3Region}.amazonaws.com/${key}`;
}

/**
 * Extract S3 object key from a full public URL string
 */
function extractKeyFromUrl(urlStr) {
  const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
  if (!urlStr || typeof urlStr !== 'string') return null;
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    try {
      const u = new URL(urlStr);
      let p = u.pathname.replace(/^\/+/, '');
      if (p.startsWith(`${BUCKET_NAME}/`)) {
        p = p.substring(BUCKET_NAME.length + 1);
      }
      return p;
    } catch {
      return null;
    }
  }
  return urlStr.replace(/^\/+/, '');
}

/**
 * Process image buffer and upload to S3/R2.
 * Falls back to base64 data URL if no cloud credentials are configured
 * or if S3 upload fails — this ensures images always display correctly on the website.
 */
async function processAndUploadImage(fileBuffer, originalFilename = '') {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer provided for image processing.');
  }

  const client = getS3Client();

  // ── Cloud storage path (S3 / Cloudflare R2) ──────────────────────────────
  if (client) {
    try {
      const ext = (path.extname(originalFilename) || '.jpg').toLowerCase();
      const key = `cars/img-${uuidv4()}${ext}`;
      const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';

      const contentTypeMap = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.webp': 'image/webp',
        '.gif': 'image/gif'
      };
      const contentType = contentTypeMap[ext] || 'image/jpeg';

      await client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      }));

      return getPublicUrl(key);
    } catch (err) {
      console.warn('⚠️  S3 upload error (using disk fallback):', err.message);
    }
  }

  // ── Local disk storage fallback (/uploads/img-uuid.ext) ───────────────────
  try {
    const ext = (path.extname(originalFilename) || '.jpg').toLowerCase();
    const filename = `img-${uuidv4()}${ext}`;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('⚠️  Disk write error for image (falling back to base64):', err.message);
    const ext = (path.extname(originalFilename) || '.jpg').toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    const mime = mimeMap[ext] || 'image/jpeg';
    const base64 = fileBuffer.toString('base64');
    return `data:${mime};base64,${base64}`;
  }
}

/**
 * Upload video buffer to S3/R2.
 * Saves to local disk /uploads/video-uuid.ext if S3 is unavailable,
 * returning a streamable HTTP URL for browser <video> tags.
 */
async function uploadVideo(fileBuffer, originalFilename = '', mimeType = 'video/mp4') {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer provided for video upload.');
  }

  const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15 MB limit
  if (fileBuffer.length > MAX_VIDEO_SIZE) {
    throw new Error('Video file exceeds the 15 MB maximum size limit.');
  }

  const client = getS3Client();

  // ── Cloud storage path ────────────────────────────────────────────────────
  if (client) {
    try {
      const ext = (path.extname(originalFilename) || '.mp4').toLowerCase();
      const key = `cars/video-${uuidv4()}${ext}`;
      const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'salone-auto-media';
      await client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType || 'video/mp4',
      }));
      return getPublicUrl(key);
    } catch (err) {
      console.warn('⚠️  S3 video upload error (using disk fallback):', err.message);
    }
  }

  // ── Local disk storage fallback (/uploads/video-uuid.ext) ─────────────────
  try {
    const ext = (path.extname(originalFilename) || '.mp4').toLowerCase();
    const filename = `video-${uuidv4()}${ext}`;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('⚠️  Disk write error for video (falling back to base64):', err.message);
    const mime = mimeType || 'video/mp4';
    const base64 = fileBuffer.toString('base64');
    return `data:${mime};base64,${base64}`;
  }
}

/**
 * Delete associated media from Cloud Storage by URL or array of URLs.
 * Skips base64 data URLs — those are embedded in the database, not in S3.
 */
async function deleteCloudMedia(fileUrlOrUrls) {
  if (!fileUrlOrUrls) return;
  const urls = Array.isArray(fileUrlOrUrls) ? fileUrlOrUrls : [fileUrlOrUrls];
  // Skip base64 data URLs — they live in the database, nothing to delete from S3
  const s3Urls = urls.filter(u => u && !String(u).startsWith('data:'));
  const keys = s3Urls.map(extractKeyFromUrl).filter(Boolean);

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
    console.error('Failed to delete media from Cloud Storage:', err.message);
  }
}

/**
 * Auto-converts any legacy base64 data:video strings into streamable /uploads/video-uuid.mp4 files.
 */
function convertDataUrlVideoToDisk(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.startsWith('data:video/')) {
    return videoUrl;
  }
  try {
    const matches = videoUrl.match(/^data:video\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) return videoUrl;
    const ext = matches[1] === 'quicktime' ? 'mov' : (matches[1] || 'mp4');
    const base64Data = matches[2];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const filename = `video-${uuidv4()}.${ext}`;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('Data URL video conversion note:', err.message);
    return videoUrl;
  }
}

module.exports = {
  processAndUploadImage,
  uploadVideo,
  convertDataUrlVideoToDisk,
  deleteCloudMedia,
  getPublicUrl,
  extractKeyFromUrl,
};
