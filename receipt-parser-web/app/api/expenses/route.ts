import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { protectUserResource } from '@/lib/auth';
import { 
    validateUserId, 
    validateDate, 
    validateSearch, 
    validatePagination, 
    createValidationErrorResponse 
} from '@/lib/validation';



export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const searchParam = searchParams.get('search');
        const limitParam = searchParams.get('limit');
        const offsetParam = searchParams.get('offset');
        const botId = searchParams.get('botId');
        const category = searchParams.get('category');
        const sortBy = searchParams.get('sortBy') || 'expense_date';
        const sortOrder = searchParams.get('sortOrder') || 'DESC';
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }
        
        // Validate authentication and authorization
        const authResult = await protectUserResource(request, userId);
        if (!authResult.isAuthenticated && authResult.response) {
            return authResult.response;
        }
        
        // Validate query parameters
        const errors: string[] = [];
        const sanitizedData: Record<string, string | number> = {};
        
        // Validate user ID
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.isValid) {
            errors.push(...userIdValidation.errors);
        } else if (userIdValidation.sanitizedData) {
            Object.assign(sanitizedData, userIdValidation.sanitizedData);
        }
        
        // Validate dates
        const startDateValidation = validateDate(startDateParam, 'startDate');
        if (!startDateValidation.isValid) {
            errors.push(...startDateValidation.errors);
        } else if (startDateValidation.sanitizedData) {
            Object.assign(sanitizedData, startDateValidation.sanitizedData);
        }
        
        const endDateValidation = validateDate(endDateParam, 'endDate');
        if (!endDateValidation.isValid) {
            errors.push(...endDateValidation.errors);
        } else if (endDateValidation.sanitizedData) {
            Object.assign(sanitizedData, endDateValidation.sanitizedData);
        }
        
        // Validate search
        const searchValidation = validateSearch(searchParam);
        if (!searchValidation.isValid) {
            errors.push(...searchValidation.errors);
        } else if (searchValidation.sanitizedData) {
            Object.assign(sanitizedData, searchValidation.sanitizedData);
        }
        
        // Validate pagination
        const paginationValidation = validatePagination(limitParam, offsetParam);
        if (!paginationValidation.isValid) {
            errors.push(...paginationValidation.errors);
        } else if (paginationValidation.sanitizedData) {
            Object.assign(sanitizedData, paginationValidation.sanitizedData);
        }
        
        // Validate botId if provided
        if (botId && !/^[a-zA-Z0-9_-]+$/.test(botId)) {
            errors.push('Invalid bot ID format');
        }
        
        // Validate category if provided
        if (category && category.length > 50) {
            errors.push('Category too long');
        }
        
        if (errors.length > 0) {
            return createValidationErrorResponse(errors);
        }
        
        const validatedStartDate = sanitizedData.startDate as string | undefined;
        const validatedEndDate = sanitizedData.endDate as string | undefined;
        const validatedSearch = sanitizedData.search as string | undefined;
        const validatedLimit = sanitizedData.limit as number;
        const validatedOffset = sanitizedData.offset as number;

        // Build secure SQL query with parameterized queries
        let query = `
            SELECT e.*, b.bot_username 
            FROM expenses e
            LEFT JOIN user_telegram_bots b ON e.bot_id = b.id
            WHERE e.user_id = $1
        `;
        const params: (string | number)[] = [userId];
        let paramIdx = 2;

        // Add date filters with validation
        if (validatedStartDate) {
            query += ` AND e.expense_date >= $${paramIdx++}`;
            params.push(validatedStartDate);
        }
        if (validatedEndDate) {
            query += ` AND e.expense_date <= $${paramIdx++}`;
            params.push(validatedEndDate);
        }
        
        // Add bot filter with validation
        if (botId) {
            query += ` AND e.bot_id = $${paramIdx++}`;
            params.push(botId);
        }
        
        // Add category filter with validation
        if (category) {
            query += ` AND e.category = $${paramIdx++}`;
            params.push(category);
        }
        
        // Add search filter with sanitization
        if (validatedSearch) {
            query += ` AND (e.vendor ILIKE $${paramIdx} OR e.comment ILIKE $${paramIdx} OR e.location ILIKE $${paramIdx})`;
            params.push(`%${validatedSearch}%`);
            paramIdx++;
        }

        // Validate sortBy to prevent SQL injection
        const allowedSortCols = ['expense_date', 'amount_sgd', 'vendor', 'category', 'created_at'];
        const finalSortBy = (sortBy && allowedSortCols.includes(sortBy)) ? sortBy : 'expense_date';
        const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Add pagination with validated limits
        query += ` ORDER BY e.${finalSortBy} ${finalSortOrder} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        params.push(validatedLimit, validatedOffset);

        // Execute query with timeout
        const result = await pool.query({
            text: query,
            values: params
        });

        return NextResponse.json({
            success: true,
            expenses: result.rows,
            pagination: {
                limit: validatedLimit,
                offset: validatedOffset,
                total: result.rowCount || 0
            }
        });
    } catch (error) {
        console.error('Get Expenses Error:', error);
        
        // Don't expose internal error details to client
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
