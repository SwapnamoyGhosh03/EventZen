import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

export const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: false,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
let minioAvailable = false;

export async function initMinIO(): Promise<void> {
  const bucket = config.minio.bucket;
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
      logger.info(`MinIO bucket '${bucket}' created`);
    }
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    });
    await minioClient.setBucketPolicy(bucket, policy);
    minioAvailable = true;
    logger.info(`MinIO ready — bucket: ${bucket}`);
  } catch (err) {
    logger.warn('MinIO unavailable, falling back to local file storage:', err);
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const ext = originalName.split('.').pop() || 'jpg';
  const objectName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  if (minioAvailable) {
    try {
      const bucket = config.minio.bucket;
      await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
        'Content-Type': contentType,
      });
      return `${config.minio.publicUrl}/${bucket}/${objectName}`;
    } catch (err) {
      logger.warn('MinIO upload failed, falling back to local storage:', err);
    }
  }

  // Local fallback
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const filePath = path.join(UPLOAD_DIR, objectName);
  await fs.promises.writeFile(filePath, buffer);
  return `http://localhost:${config.port}/uploads/${objectName}`;
}
