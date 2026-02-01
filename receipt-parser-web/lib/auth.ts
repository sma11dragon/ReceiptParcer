// Authentication and authorization utilities for ReceiptAI API

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

// Types
export interface UserPayload {
    userId: string;
    email?: string;
    role: 'user' | 'admin';
    exp?: number;
    iat?: number;
}

export interface AuthResult {
    isAuthenticated: boolean;
    user?: UserPayload;
    error?: string;
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d'; // 7 days
const SALT_ROUNDS = 10;

// Rate limiting for authentication endpoints
const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5;
const authRateLimitMap = new Map<string, { attempts: number; resetTime: number }>();

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Check rate limit for authentication attempts
 */
export function checkAuthRateLimit(ip: string): boolean {
    const now = Date.now();
    const limitData = authRateLimitMap.get(ip);
    
    if (!limitData || now > limitData.resetTime) {
        authRateLimitMap.set(ip, { attempts: 1, resetTime: now + AUTH_RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (limitData.attempts >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
        return false;
    }
    
    limitData.attempts++;
    return true;
}

/**
 * Reset rate limit for an IP (call after successful authentication)
 */
export function resetAuthRateLimit(ip: string): void {
    authRateLimitMap.delete(ip);
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string, email?: string, role: 'user' | 'admin' = 'user'): string {
    const payload: UserPayload = {
        userId,
        email,
        role,
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthResult {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        return {
            isAuthenticated: true,
            user: decoded
        };
    } catch (error) {
        return {
            isAuthenticated: false,
            error: error instanceof Error ? error.message : 'Invalid token'
        };
    }
}

/**
 * Extract token from request headers
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // Check cookie (for web clients)
    const tokenCookie = request.cookies.get('auth_token');
    if (tokenCookie) {
        return tokenCookie.value;
    }
    
    // Check query parameter (for testing only - not recommended for production)
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam && process.env.NODE_ENV === 'development') {
        console.warn('Using token from query parameter - not recommended for production');
        return tokenParam;
    }
    
    return null;
}

// ====================
// MIDDLEWARE FUNCTIONS
// ====================

/**
 * Authentication middleware for API routes
 * Use this to protect routes that require authentication
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult & { response?: NextResponse }> {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
        return {
            isAuthenticated: false,
            error: 'No authentication token provided'
        };
    }
    
    const authResult = verifyToken(token);
    
    if (!authResult.isAuthenticated) {
        return {
            isAuthenticated: false,
            error: authResult.error || 'Invalid authentication token',
            response: NextResponse.json(
                { error: 'Authentication failed', details: 'Invalid or expired token' },
                { status: 401 }
            )
        };
    }
    
    return authResult;
}

/**
 * Authorization middleware - check if user has required role
 */
export function authorizeRole(requiredRole: 'user' | 'admin', user: UserPayload): boolean {
    // Admin can access everything
    if (user.role === 'admin') {
        return true;
    }
    
    // User can only access user-level resources
    return requiredRole === 'user';
}

/**
 * Combined authentication and authorization middleware
 */
export async function protectRoute(
    request: NextRequest,
    requiredRole: 'user' | 'admin' = 'user'
): Promise<AuthResult & { response?: NextResponse }> {
    // Authenticate
    const authResult = await authenticateRequest(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
        return authResult;
    }
    
    // Authorize
    if (!authorizeRole(requiredRole, authResult.user)) {
        return {
            isAuthenticated: false,
            error: 'Insufficient permissions',
            response: NextResponse.json(
                { error: 'Forbidden', details: 'You do not have permission to access this resource' },
                { status: 403 }
            )
        };
    }
    
    return authResult;
}

/**
 * Middleware for user-specific resource access
 * Ensures user can only access their own resources
 */
export async function protectUserResource(
    request: NextRequest,
    resourceUserId: string
): Promise<AuthResult & { response?: NextResponse }> {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
        return authResult;
    }
    
    // Admins can access any user's resources
    if (authResult.user.role === 'admin') {
        return authResult;
    }
    
    // Users can only access their own resources
    if (authResult.user.userId !== resourceUserId) {
        return {
            isAuthenticated: false,
            error: 'Access denied to other user\'s resources',
            response: NextResponse.json(
                { error: 'Forbidden', details: 'You can only access your own resources' },
                { status: 403 }
            )
        };
    }
    
    return authResult;
}

// ====================
// PASSWORD VALIDATION
// ====================

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize user input for authentication
 */
export function sanitizeAuthInput(input: string): string {
    return input
        .trim()
        .replace(/[<>"'&]/g, '') // Remove dangerous characters
        .substring(0, 100); // Limit length
}

// ====================
// RESPONSE HELPERS
// ====================

/**
 * Create success response with token
 */
export function createAuthSuccessResponse(
    userId: string,
    email?: string,
    role: 'user' | 'admin' = 'user',
    additionalData: Record<string, any> = {}
): NextResponse {
    const token = generateToken(userId, email, role);
    
    const responseData = {
        success: true,
        token,
        user: {
            userId,
            email,
            role
        },
        ...additionalData
    };
    
    const response = NextResponse.json(responseData, { status: 200 });
    
    // Set HTTP-only cookie for web clients
    response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/'
    });
    
    return response;
}

/**
 * Create error response for authentication failures
 */
export function createAuthErrorResponse(
    error: string,
    details?: string,
    status: number = 401
): NextResponse {
    return NextResponse.json(
        {
            error,
            details: details || error,
            timestamp: new Date().toISOString()
        },
        { status }
    );
}

// ====================
// SECURITY HEADERS
// ====================

/**
 * Add security headers to API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Security headers for API responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CSP for API endpoints
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self';"
    );
    
    return response;
}