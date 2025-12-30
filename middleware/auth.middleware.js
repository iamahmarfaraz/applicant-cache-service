// middleware/auth.middleware.js

const {
  getToken,
  bulkLoadTokens,
  getLastTokenSyncTime
} = require("../cache/tokenCache");

const {
  fetchTokensIncremental
} = require("../services/token.service");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 1. FAST PATH — CACHE HIT
    const cached = getToken(token);
    if (cached) {

      if (!cached.tenantId) {
        return res.status(401).json({
          message: "Invalid tenant context"
        });
      }

      req.auth = {
        token,
        userId: cached.userId,
        tenantId: cached.tenantId
      };
      return next();
    }

    // 2. CACHE MISS - INCREMENTAL TOKEN FETCH
    const lastSyncTime = getLastTokenSyncTime();
    const rows = await fetchTokensIncremental(lastSyncTime);

    if (rows && rows.length > 0) {
      bulkLoadTokens(rows);
    }

    // 3. RETRY CACHE
    const refreshed = getToken(token);
    if (!refreshed) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }

    //  DO NOT ALLOW NULL TENANT
    if (!refreshed.tenantId) {
      return res.status(401).json({
        message: "Invalid tenant context"
      });
    }

    // 4. ATTACH AUTH CONTEXT
    req.auth = {
      token,
      userId: refreshed.userId,
      tenantId: refreshed.tenantId
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      message: "Authentication failed"
    });
  }
}

module.exports = authMiddleware;