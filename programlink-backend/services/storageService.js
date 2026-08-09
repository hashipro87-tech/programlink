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

// ─── S3 / Cloudflare R2 storage ──────────────────────────────────────────────
// Supports both AWS S3 and Cloudflare R2 (S3-compatible).
// For R2, set these Railway env vars:
//   AWS_ACCESS_KEY_ID     — R2 Access Key ID
//   AWS_SECRET_ACCESS_KEY — R2 Secret Access Key
//   AWS_S3_BUCKET         — bucket name (e.g. cacfplink-docs)
//   AWS_REGION            — auto  (R2 uses "auto")
//   AWS_ENDPOINT_URL      — https://<account_id>.r2.cloudflarestorage.com
//   AWS_PUBLIC_URL        — https://pub-<hash>.r2.dev  (public bucket URL, no trailing slash)

let s3Client;
function getS3() {
  if (!s3Client) {
    const { S3Client } = require('@aws-sdk/client-s3');
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };
    // R2 requires a custom endpoint
    if (process.env.AWS_ENDPOINT_URL) {
      config.endpoint = process.env.AWS_ENDPOINT_URL;
    }
    s3Client = new S3Client(config);
  }
  return s3Client;
}

async function uploadS3(buffer, originalName, mimeType, folder) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${uuidv4()}${ext}`;

  const cmd = {
    Bucket:      process.env.AWS_S3_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
  };
  // Only add ACL for real S3 (R2 doesn't support ACLs)
  if (!process.env.AWS_ENDPOINT_URL) cmd.ACL = 'private';

  await getS3().send(new PutObjectCommand(cmd));

  // Build public URL:
  //   R2 with public access: use AWS_PUBLIC_URL env var
  //   Standard S3: build from bucket + region
  let url;
  if (process.env.AWS_PUBLIC_URL) {
    url = `${process.env.AWS_PUBLIC_URL}/${key}`;
  } else {
    url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
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
