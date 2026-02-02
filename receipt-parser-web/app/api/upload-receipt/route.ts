// Build: 2026-02-02 - Use AWS SDK with custom TLS handling for R2
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import sharp from 'sharp';
import https from 'https';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'receiptai-images';

if (!R2_ENDPOINT || !R2_PUBLIC_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('R2 environment variables must be set');
}

// Create custom HTTPS agent with TLS 1.2
const httpsAgent = new https.Agent({
  secureProtocol: 'TLSv1_2_method',
  rejectUnauthorized: true,
});

// Create S3 client for Cloudflare R2 with custom HTTP handler
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  // Force path style for R2 compatibility
  forcePathStyle: true,
  // Use custom request handler with TLS 1.2
  requestHandler: new NodeHttpHandler({
    httpsAgent,
    connectionTimeout: 30000,
    socketTimeout: 30000,
  }),
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
    
    // Upload to R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      Body: compressedBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });
    
    await s3Client.send(command);
    
    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;
    
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileKey: fileKey,
      originalSize: imageBuffer.length,
      compressedSize: compressedBuffer.length,
      savings: Math.round((1 - compressedBuffer.length / imageBuffer.length) * 100) + '%'
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
