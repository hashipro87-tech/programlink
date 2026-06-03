// storageService.js
// Wraps file uploads. Uses S3 when AWS credentials are configured,
// falls back to local disk storage in development so the app works without AWS.

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs   = require('fs');

// ─── Local disk fallback ──────────────────────────────────────────────────────
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

function ensureUploadDir() {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

async function uploadLocal(buffer, originalName, folder) {
  ensureUploadDir();
  const ext      = path.extname(originalName).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const dest     = path.join(LOCAL_UPLOAD_DIR, filename);
  fs.writeFileSync(dest, buffer);
  const key = `${folder}/${filename}`;
  const url = `http://localhost:${process.env.PORT || 4000}/uploads/${filename}`;
  return { url, key };
}

async function deleteLocal(key) {
  const filename = path.basename(key);
  const filepath = path.join(LOCAL_UPLOAD_DIR, filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}

// ─── S3 storage ──────────────────────────────────────────────────────────────
let s3Client;
function getS3() {
  if (!s3Client) {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

async function uploadS3(buffer, originalName, mimeType, folder) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${uuidv4()}${ext}`;

  await getS3().send(new PutObjectCommand({
    Bucket:      process.env.AWS_S3_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
    ACL:         'private',
  }));

  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  return { url, key };
}

async function deleteS3(key) {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  await getS3().send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key:    key,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────
function useS3() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);
}

async function uploadFile(buffer, originalName, mimeType, folder = 'documents') {
  if (useS3()) {
    return uploadS3(buffer, originalName, mimeType, folder);
  }
  console.log('[storage] AWS not configured — saving file to local disk');
  return uploadLocal(buffer, originalName, folder);
}

async function deleteFile(key) {
  if (useS3()) return deleteS3(key);
  return deleteLocal(key);
}

module.exports = { uploadFile, deleteFile };
