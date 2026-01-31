// Build: 2026-01-31 - Force rebuild with new env vars
import { NextRequest, NextResponse } from 'next/server';
import { AwsV4Signer } from 'aws4fetch';
import sharp from 'sharp';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'receiptai-images';

if (!R2_ENDPOINT || !R2_PUBLIC_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('R2 environment variables must be set');
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    let filename = request.nextUrl.searchParams.get('filename');
    
    if (!userId || !filename) {
      return NextResponse.json(
        { error: 'Missing params', details: 'Need userId and filename' },
        { status: 400 }
      );
    }
    
    // Validate and sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (sanitizedFilename !== filename) {
      return NextResponse.json(
        { error: 'Invalid filename', details: 'Filename contains invalid characters' },
        { status: 400 }
      );
    }
    filename = sanitizedFilename;
    
    // Get raw binary body
    const arrayBuffer = await request.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'Empty body', details: 'No binary data received' },
        { status: 400 }
      );
    }
    
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
    
    console.log('Original size:', arrayBuffer.byteLength, 'Compressed:', compressedBuffer.length);
    
    // Build R2 object key
    const fileKey = `receipts/${userId}/${filename}`;
    const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${fileKey}`;
    
    // Sign the request with aws4fetch
    // Convert Buffer to Uint8Array for proper type compatibility
    const bodyArray = new Uint8Array(compressedBuffer);
    
    const signer = new AwsV4Signer({
      url: uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'x-amz-acl': 'public-read',
      },
      body: bodyArray,
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    });
    
    // Get signed request
    const signed = await signer.sign();
    
    // Upload using native fetch (avoids SSL issues)
    // signed is an object with url, method, headers, body
    const response = await fetch(signed.url, {
      method: signed.method,
      headers: signed.headers,
      body: signed.body,
    });
    
    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }
    
    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;
    
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileKey: fileKey,
      originalSize: arrayBuffer.byteLength,
      compressedSize: compressedBuffer.length,
      savings: Math.round((1 - compressedBuffer.length / arrayBuffer.byteLength) * 100) + '%'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 500 }
    );
  }
}
