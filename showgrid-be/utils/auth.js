const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

const requireAuth = (req, res, next) => {
    console.log('[AUTH DEBUG] Headers:', req.headers);
    console.log('[AUTH DEBUG] Auth Object:', req.auth);

    if (!req.auth || !req.auth.userId) {
        console.warn('[AUTH DEBUG] Unauthorized access attempt');
        return res.status(401).json({ message: 'Unauthenticated' });
    }
    next();
};

module.exports = { ClerkExpressWithAuth, requireAuth };
