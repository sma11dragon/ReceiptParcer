// Build: 2026-02-02 - Use AWS SDK default HTTP handler for R2
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'receiptai-images';

if (!R2_ENDPOINT || !R2_PUBLIC_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('R2 environment variables must be set');
}

// Create S3 client for Cloudflare R2 with default HTTP handler
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  // Force path style for R2 compatibility
  forcePathStyle: true,
});

import { validateUserId, validateFilename, createValidationErrorResponse, sanitizeFilename } from '@/lib/validation';
import { protectRoute } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await protectRoute(request, 'user');
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }
    
    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filename = searchParams.get('filename');
    
    const errors: string[] = [];
    
    // Validate user ID
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.isValid) {
      errors.push(...userIdValidation.errors);
    }
    
    // Validate filename
    const filenameValidation = validateFilename(filename);
    if (!filenameValidation.isValid) {
      errors.push(...filenameValidation.errors);
    }
    
    if (errors.length > 0) {
      return createValidationErrorResponse(errors);
    }
    
    const validatedUserId = userIdValidation.sanitizedData?.userId as string;
    const validatedFilename = filenameValidation.sanitizedData?.filename as string;
    
    // Additional security: ensure user can only upload to their own directory
    if (authResult.user && authResult.user.userId !== validatedUserId && 
        authResult.user.role !== 'admin' && authResult.user.role !== 'service') {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only upload receipts for your own account' },
        { status: 403 }
      );
    }
    
    // Sanitize filename
    const finalFilename = sanitizeFilename(validatedFilename);
    
    // Support both binary and base64 JSON input
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer;
    
    if (contentType.includes('application/json')) {
      // Handle base64 JSON input from n8n
      const jsonBody = await request.json();
      if (!jsonBody.imageData) {
        return NextResponse.json(
          { error: 'Invalid JSON body', details: 'Missing imageData' },
          { status: 400 }
        );
      }
      imageBuffer = Buffer.from(jsonBody.imageData, 'base64');
    } else {
      // Handle raw binary input
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        return NextResponse.json(
          { error: 'Empty body', details: 'No binary data received' },
          { status: 400 }
        );
      }
      imageBuffer = Buffer.from(arrayBuffer);
    }
    
    // Compress image with Sharp
    const compressedBuffer = await sharp(imageBuffer)
      .resize(1024, 1365, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 65,
        progressive: true,
        mozjpeg: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeCoding: true,
        chromaSubsampling: '4:2:0'
      })
      .withMetadata({
        exif: {},
      })
      .toBuffer();
    
    console.log('Original size:', imageBuffer.length, 'Compressed:', compressedBuffer.length);
    
    // Build R2 object key
    const fileKey = `receipts/${validatedUserId}/${finalFilename}`;
    
    let publicUrl: string;
    let uploadSuccess = false;
    let uploadError: string | null = null;
    
    // Try R2 upload first
    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
        Body: compressedBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });
      
      await s3Client.send(command);
      publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;
      uploadSuccess = true;
    } catch (r2Error) {
      console.error('R2 upload failed:', r2Error);
      uploadError = r2Error instanceof Error ? r2Error.message : 'Unknown R2 error';
      
      // Fallback: Store in Vercel's temporary storage (./tmp folder)
      // This is a temporary solution until R2 SSL issue is resolved
      const fs = require('fs');
      const path = require('path');
      const tmpDir = path.join(process.cwd(), 'tmp', 'receipts', validatedUserId);
      
      // Ensure directory exists
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      const tmpPath = path.join(tmpDir, finalFilename);
      fs.writeFileSync(tmpPath, compressedBuffer);
      
      // Use Vercel's public URL (this won't persist across deployments!)
      publicUrl = `/api/tmp-receipts/${validatedUserId}/${finalFilename}`;
      
      console.log('Stored image locally at:', tmpPath);
      console.log('WARNING: Images stored locally will not persist across Vercel deployments!');
    }
    
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileKey: fileKey,
      originalSize: imageBuffer.length,
      compressedSize: compressedBuffer.length,
      savings: Math.round((1 - compressedBuffer.length / imageBuffer.length) * 100) + '%',
      r2UploadSuccess: uploadSuccess,
      r2Error: uploadError,
      warning: uploadSuccess ? undefined : 'Image stored locally due to R2 SSL issues. Images may not persist across deployments.'
    });
    
  } catch (error: unknown) {
    console.error('Upload error:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: 'Upload failed', details: errorMessage },
      { status: 500 }
    );
  }
}
