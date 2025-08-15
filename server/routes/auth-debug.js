// Admin Authentication Test Endpoint
// Add this to your server routes for debugging

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Debug endpoint to check current authentication status
router.get('/auth-debug', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.json({
                authenticated: false,
                error: 'No Authorization header provided',
                hint: 'Include "Authorization: Bearer <token>" header'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.json({
                authenticated: false,
                error: 'No token in Authorization header',
                authHeader: authHeader
            });
        }

        // Try to decode token manually for debugging
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            return res.json({
                authenticated: true,
                token: {
                    valid: true,
                    userId: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    iat: decoded.iat,
                    exp: decoded.exp,
                    expiresAt: new Date(decoded.exp * 1000).toISOString()
                },
                serverTime: new Date().toISOString()
            });
            
        } catch (jwtError) {
            return res.json({
                authenticated: false,
                error: 'Invalid token',
                jwtError: jwtError.message,
                token: token.substring(0, 20) + '...'
            });
        }
        
    } catch (error) {
        return res.status(500).json({
            authenticated: false,
            error: 'Server error during authentication check',
            details: error.message
        });
    }
});

// Simple ping endpoint to test if admin routes are accessible
router.get('/ping', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Admin route accessible',
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        },
        timestamp: new Date().toISOString()
    });
});

export default router;
