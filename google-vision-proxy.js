#!/usr/bin/env node

/**
 * Secure Proxy Server for Google Vision API
 * Stores API key securely on server, not in n8n workflows
 * 
 * Usage:
 *   node google-vision-proxy.js
 * 
 * Then n8n calls: http://localhost:3001/vision/ocr
 */

const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Secure API key storage (use environment variable in production)
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY || 'AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc';

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'google-vision-proxy' });
});

// Secure OCR endpoint
app.post('/vision/ocr', async (req, res) => {
    try {
        console.log('📸 Processing OCR request');
        
        // Validate request
        if (!req.body || !req.body.image) {
            return res.status(400).json({
                error: 'Bad Request',
                details: 'Image data is required'
            });
        }

        // Prepare Google Vision API request
        const visionRequest = {
            requests: [{
                image: req.body.image,
                features: req.body.features || [{ type: 'TEXT_DETECTION', maxResults: 1 }],
                imageContext: req.body.imageContext
            }]
        };

        // Call Google Vision API
        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
            visionRequest,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-User-Project': 'receiptai-proxy'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        // Return response to n8n
        res.json(response.data);

    } catch (error) {
        console.error('❌ OCR Error:', error.message);
        
        // Handle different error types
        if (error.response) {
            // Google API error
            res.status(error.response.status).json({
                error: 'Google Vision API Error',
                details: error.response.data.error?.message || error.message
            });
        } else if (error.request) {
            // Network error
            res.status(503).json({
                error: 'Service Unavailable',
                details: 'Cannot reach Google Vision API'
            });
        } else {
            // Other errors
            res.status(500).json({
                error: 'Internal Server Error',
                details: error.message
            });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🔒 Secure Google Vision Proxy running on port ${PORT}`);
    console.log(`📝 Endpoint: http://localhost:${PORT}/vision/ocr`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`\n⚠️  IMPORTANT: Set environment variable for production:`);
    console.log(`   GOOGLE_VISION_API_KEY=your_key_here`);
    console.log(`\n📋 For n8n workflow:`);
    console.log(`   URL: http://localhost:${PORT}/vision/ocr`);
    console.log(`   Method: POST`);
    console.log(`   Body: { "image": { "content": "base64..." } }`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down proxy server...');
    process.exit(0);
});