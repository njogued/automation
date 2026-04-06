const jwt = require('jsonwebtoken');

async function authenticationMiddleware(req, res, next) {
  try {
    let { authorization } = req.headers;
    if (!authorization && req.query) {
      authorization = req.query.token;
    }
    const { challenge } = req.body;
    // Allow webhook challenge (initial handshake) without JWT verification
    if (challenge) {
        console.log("Webhook challenge detected, skipping JWT verification.");
        return next();
    }
    const { accountId, userId, backToUrl, shortLivedToken } = jwt.verify(
      authorization,
      process.env.MONDAY_SIGNING_SECRET
    );
    req.session = { accountId, userId, backToUrl, shortLivedToken };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'not authenticated' });
  }
}

async function subscriptionAuthMiddleware(req, res, next) {
    try {
        let token = null;
        // console.log("Request headers:", req.headers);

        const { challenge } = req.body;

        // Allow webhook challenge (initial handshake) without JWT verification
        if (challenge) {
            console.log("Webhook challenge detected, skipping JWT verification.");
            return next();
        }

        // Extract token from Authorization header
        if (req.headers.authorization) {
            token = req.headers.authorization;
        } else {
            return res.status(401).json({ error: "Missing Authorization header" });
        }


        // Determine which secret to use for verification
        const secret = process.env.MONDAY_SIGNING_SECRET || process.env.MONDAY_CLIENT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Server misconfiguration: missing signing secret" });
        }

        // Verify JWT using the appropriate secret
        const decoded = jwt.verify(token.trim(), secret);

        // Extract required metadata
        const { accountId, userId, aud, exp, shortLivedToken, iat } = decoded;

        // Store session data for later use
        req.session = { accountId, userId, shortLivedToken, issuedAt: iat, expiresAt: exp, aud };

        // aud: 'https://b02be-service-20455368-a7e83ef6.us.monday.app/monday/connecttrigger/subscribe',

        if (!aud.includes("monday/connecttrigger/subscribe")) {
            // console.log("Invalid aud URL:", decoded.aud);
            return res.status(403).json({ error: "Invalid audience URL" });
        }

        // console.log("Decoded JWT:", decoded);

        next(); // Proceed to the next middleware

    } catch (err) {
        console.error("JWT Verification Error:", err);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}

module.exports = {
  authenticationMiddleware,
  subscriptionAuthMiddleware,
};
