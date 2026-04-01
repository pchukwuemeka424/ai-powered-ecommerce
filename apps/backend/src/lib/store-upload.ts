import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { buffer } from 'node:stream/consumers';
import type { MultipartFile } from '@fastify/multipart';
import { put } from '@vercel/blob';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Persists a tenant image: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise local `uploads/`.
 */
export async function persistTenantUpload(
  tenantId: string,
  multipart: MultipartFile,
): Promise<{ path: string; url: string }> {
  const ext = MIME_EXT[multipart.mimetype] ?? '.jpg';
  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${ext}`;
  const fileBuffer = await buffer(multipart.file);

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const pathname = `store/${tenantId}/${filename}`;
    const blob = await put(pathname, fileBuffer, {
      access: 'public',
      token,
      contentType: multipart.mimetype,
    });
    return { path: blob.url, url: blob.url };
  }

  const dir = path.join(process.cwd(), 'uploads', tenantId);
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  await writeFile(filepath, fileBuffer);
  const publicPath = `/uploads/${tenantId}/${filename}`;
  const base = (
    process.env.PUBLIC_API_URL ?? `http://127.0.0.1:${process.env.PORT ?? '4000'}`
  ).replace(/\/$/, '');
  return { path: publicPath, url: `${base}${publicPath}` };
}
