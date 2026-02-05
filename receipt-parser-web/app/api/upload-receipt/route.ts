// Build: 2026-02-02 - Backblaze B2 Upload Implementation
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// Lazy initialization of B2 client - only created when needed at runtime
let b2Client: S3Client | null = null;

function getB2Client(): S3Client {
  if (b2Client) return b2Client;
  
  const B2_ENDPOINT = process.env.B2_ENDPOINT;
  const B2_KEY_ID = process.env.B2_KEY_ID;
  const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
  const B2_REGION = process.env.B2_REGION || 'us-west-004';
  
  if (!B2_ENDPOINT || !B2_KEY_ID || !B2_APPLICATION_KEY) {
    console.error('B2 environment variables missing:', {
      hasEndpoint: !!B2_ENDPOINT,
      hasKeyId: !!B2_KEY_ID,
      hasAppKey: !!B2_APPLICATION_KEY,
    });
    throw new Error('B2 environment variables must be set');
  }
  
  b2Client = new S3Client({
    region: B2_REGION,
    endpoint: B2_ENDPOINT,
    credentials: {
      accessKeyId: B2_KEY_ID,
      secretAccessKey: B2_APPLICATION_KEY,
    },
    forcePathStyle: true, // Required for B2
  });
  
  return b2Client;
}

// Get B2 config at runtime
function getB2Config() {
  const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;
  const B2_BUCKET = process.env.B2_BUCKET_NAME || 'receiptai-images';
  
  if (!B2_PUBLIC_URL) {
    throw new Error('B2_PUBLIC_URL environment variable must be set');
  }
  
  return { B2_PUBLIC_URL, B2_BUCKET };
}

// Keep R2 config for reading old receipts (backward compatibility)
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

import { validateUserId, validateFilename, createValidationErrorResponse, sanitizeFilename } from '@/lib/validation';
import { protectRoute } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('B2 Upload: Starting upload process');
    
    // Validate authentication
    const authResult = await protectRoute(request, 'user');
    if (!authResult.isAuthenticated && authResult.response) {
      console.log('B2 Upload: Authentication failed');
      return authResult.response;
    }
    
    console.log('B2 Upload: User authenticated', authResult.user?.userId);
    
    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filename = searchParams.get('filename');
    
    console.log('B2 Upload: Query params', { userId, filename });
    
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
      console.log('B2 Upload: Validation errors', errors);
      return createValidationErrorResponse(errors);
    }
    
    const validatedUserId = userIdValidation.sanitizedData?.userId as string;
    const validatedFilename = filenameValidation.sanitizedData?.filename as string;
    
    console.log('B2 Upload: Validated params', { validatedUserId, validatedFilename });
    
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
    
    // Get raw binary body
    const arrayBuffer = await request.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'Empty body', details: 'No binary data received' },
        { status: 400 }
      );
    }
    
    console.log('B2 Upload: Received body', arrayBuffer.byteLength, 'bytes');
    
    // Compress image with Sharp
    const compressedBuffer = await sharp(Buffer.from(arrayBuffer))
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
    
    console.log('B2 Upload: Compressed image', {
      original: arrayBuffer.byteLength,
      compressed: compressedBuffer.length,
      savings: Math.round((1 - compressedBuffer.length / arrayBuffer.byteLength) * 100) + '%'
    });
    
    // Build B2 object key
    const fileKey = `receipts/${validatedUserId}/${finalFilename}`;
    
    // Get B2 config and client at runtime
    const b2Config = getB2Config();
    const client = getB2Client();
    
    console.log('B2 Upload: Uploading to B2', {
      bucket: b2Config.B2_BUCKET,
      fileKey: fileKey
    });
    
    // Upload to B2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: b2Config.B2_BUCKET,
      Key: fileKey,
      Body: compressedBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });
    
    await client.send(command);
    
    console.log('B2 Upload: Successfully uploaded to B2');
    
    // Build public URL
    const publicUrl = `${b2Config.B2_PUBLIC_URL}/${fileKey}`;
    
    console.log('B2 Upload: Public URL', publicUrl);
    
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileKey: fileKey,
      originalSize: arrayBuffer.byteLength,
      compressedSize: compressedBuffer.length,
      savings: Math.round((1 - compressedBuffer.length / arrayBuffer.byteLength) * 100) + '%',
      storage: 'backblaze-b2',
      bucket: b2Config.B2_BUCKET
    });
    
  } catch (error: unknown) {
    console.error('B2 Upload error:', error);
    
    let errorMessage = 'Unknown error';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    // Log full error for debugging
    console.error('B2 Upload full error:', {
      message: errorMessage,
      details: errorDetails,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: errorMessage,
        storage: 'backblaze-b2'
      },
      { status: 500 }
    );
  }
}
