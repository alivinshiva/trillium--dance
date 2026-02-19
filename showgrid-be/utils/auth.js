const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

const requireAuth = (req, res, next) => {
    if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ message: 'Unauthenticated' });
    }
    next();
};

module.exports = { ClerkExpressWithAuth, requireAuth };
