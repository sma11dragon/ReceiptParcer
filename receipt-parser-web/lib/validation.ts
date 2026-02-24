// Simplified input validation for ReceiptAI API

import { NextResponse } from 'next/server';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    sanitizedData?: Record<string, string | number | boolean>;
}

/**
 * Validate user ID
 */
export function validateUserId(userId: string | null): ValidationResult {
    const errors: string[] = [];
    
    if (!userId || userId.trim() === '') {
        errors.push('User ID is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
        errors.push('Invalid user ID format');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 && userId ? { userId: userId.trim() } : undefined
    };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string | null, fieldName: string): ValidationResult {
    const errors: string[] = [];
    
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`${fieldName} must be in YYYY-MM-DD format`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 && date ? { [fieldName]: date } : undefined
    };
}

/**
 * Validate filename
 */
export function validateFilename(filename: string | null): ValidationResult {
    const errors: string[] = [];
    
    if (!filename || filename.trim() === '') {
        errors.push('Filename is required');
    } else if (!/^[a-zA-Z0-9._,-]+$/.test(filename)) {
        errors.push('Filename contains invalid characters');
    } else if (filename.length > 255) {
        errors.push('Filename too long');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 && filename ? { filename: filename.trim() } : undefined
    };
}

/**
 * Validate search term
 */
export function validateSearch(search: string | null): ValidationResult {
    const errors: string[] = [];
    
    if (search && search.length > 100) {
        errors.push('Search term too long');
    }
    
    // Sanitize search term to prevent SQL injection
    const sanitizedSearch = search ? search.replace(/[%_]/g, '\\$&').trim() : '';
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 && search ? { search: sanitizedSearch } : undefined
    };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit: string | null, offset: string | null): ValidationResult {
    const errors: string[] = [];
    
    const parsedLimit = limit ? parseInt(limit) : 50;
    const parsedOffset = offset ? parseInt(offset) : 0;
    
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        errors.push('Limit must be between 1 and 100');
    }
    
    if (isNaN(parsedOffset) || parsedOffset < 0) {
        errors.push('Offset must be a positive number');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? { 
            limit: Math.min(Math.max(parsedLimit, 1), 100),
            offset: Math.max(parsedOffset, 0)
        } : undefined
    };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(errors: string[]): NextResponse {
    return NextResponse.json(
        {
            error: 'Validation failed',
            details: errors,
            timestamp: new Date().toISOString()
        },
        { status: 400 }
    );
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/\.\.\//g, '')
        .replace(/[^a-zA-Z0-9._,-]/g, '_')
        .substring(0, 255);
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}