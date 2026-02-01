// Build: 2026-01-31 - Force rebuild with new env vars
export const runtime = 'nodejs'; // Force Node.js runtime to avoid Edge SSL issues

import { NextRequest, NextResponse } from 'next/server';
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

// Helper function to make HTTPS request with custom TLS settings
const makeHttpsRequest = (options: https.RequestOptions, body?: Buffer): Promise<{ statusCode?: number; statusMessage?: string; headers: any; data: string }> => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

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
    if (authResult.user && authResult.user.userId !== validatedUserId && authResult.user.role !== 'admin') {
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
    const fileKey = `receipts/${validatedUserId}/${finalFilename}`;
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
    
     // Upload to R2 using native https module with custom TLS
    const url = new URL(uploadUrl);
    const headers = {
      'Content-Type': 'image/jpeg',
      'x-amz-acl': 'public-read',
      'x-amz-content-sha256': crypto.createHash('sha256').update(compressedBuffer).digest('hex'),
      'x-amz-date': amzDate,
      'Authorization': `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=host;x-amz-acl;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
      'Content-Length': compressedBuffer.length.toString()
    };
    
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'PUT',
      headers,
      // Force TLS 1.2 for Cloudflare R2 compatibility
      secureProtocol: 'TLSv1_2_method',
      // Cloudflare R2 uses valid certificates, no need to reject
      rejectUnauthorized: true,
      // Increase timeout
      timeout: 30000
    };
    
    const response = await makeHttpsRequest(options, compressedBuffer);
    
    if (response.statusCode !== 200) {
      throw new Error(`R2 upload failed: ${response.statusCode} ${response.statusMessage}`);
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
