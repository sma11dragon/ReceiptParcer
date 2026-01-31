// Build: 2026-01-31 - Force rebuild with new env vars
export const runtime = 'nodejs'; // Force Node.js runtime to avoid Edge SSL issues

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import sharp from 'sharp';
import crypto from 'crypto';
import { format } from 'date-fns';
import https from 'https';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'receiptai-images';

if (!R2_ENDPOINT || !R2_PUBLIC_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('R2 environment variables must be set');
}

 // Create axios instance with custom SSL/TLS settings
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    // Force TLS 1.2 for compatibility with Cloudflare R2
    secureProtocol: 'TLSv1_2_method',
    // Accept self-signed certificates if needed
    rejectUnauthorized: false,
  }),
  timeout: 30000,
});

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
    
    // Build R2 object key and upload URL
    const fileKey = `receipts/${userId}/${filename}`;
    const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${fileKey}`;
    
     // Generate AWS SigV4 signature manually
    
    const now = new Date();
    const amzDate = format(now, 'yyyyMMdd\'T\'HHmmss\'Z\'');
    const dateStamp = format(now, 'yyyyMMdd');
    
     // Create canonical request
    const canonicalRequest = [
      'PUT',
      `/${R2_BUCKET}/${fileKey}`,
      '',
      `host:${new URL(R2_ENDPOINT!).hostname}`,
      `x-amz-acl:public-read`,
      `x-amz-content-sha256:${crypto.createHash('sha256').update(compressedBuffer).digest('hex')}`,
      `x-amz-date:${amzDate}`,
      '',
      'host;x-amz-acl;x-amz-content-sha256;x-amz-date',
      crypto.createHash('sha256').update(compressedBuffer).digest('hex')
    ].join('\n');
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    // Calculate signature
    const hmac = (key: Buffer, msg: string) => crypto.createHmac('sha256', key).update(msg).digest();
    const getSignatureKey = (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = hmac(Buffer.from('AWS4' + key), dateStamp);
      const kRegion = hmac(kDate, regionName);
      const kService = hmac(kRegion, serviceName);
      return hmac(kService, 'aws4_request');
    };
    
    const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY!, dateStamp, 'auto', 's3');
    const signature = hmac(signingKey, stringToSign).toString('hex');
    
     // Upload to R2 using axios with proper headers
    await axiosInstance.put(uploadUrl, compressedBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'x-amz-acl': 'public-read',
        'x-amz-content-sha256': crypto.createHash('sha256').update(compressedBuffer).digest('hex'),
        'x-amz-date': amzDate,
        'Authorization': `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=host;x-amz-acl;x-amz-content-sha256;x-amz-date, Signature=${signature}`
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    
    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;
    
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileKey: fileKey,
      originalSize: arrayBuffer.byteLength,
      compressedSize: compressedBuffer.length,
      savings: Math.round((1 - compressedBuffer.length / arrayBuffer.byteLength) * 100) + '%'
    });
    
   } catch (error: unknown) {
     console.error('Upload error:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      console.error('Error details:', axiosError.response?.data || 'No response data');
      errorMessage = 'Axios request failed';
    }
    
    return NextResponse.json(
      { error: 'Upload failed', details: errorMessage },
      { status: 500 }
    );
  }
}
