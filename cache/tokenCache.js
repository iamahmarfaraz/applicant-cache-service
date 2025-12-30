/**
 * token -> {
 *   token,
 *   userId,
 *   tenantId,
 *   lastUpdated,     // from DB (GREATEST(u.LUDate, ld.LUDate))
 *   lastFetchedAt    // local cache time
 * }
 */

const tokenCache = new Map();

/**
 * GLOBAL incremental cursor
 * Used to fetch only new/updated tokens from DB
 */
let lastTokenSyncTime = null;


function getToken(token) {
  return tokenCache.get(token) || null;
}

function hasToken(token) {
  return tokenCache.has(token);
}

function setToken(token, data) {
  tokenCache.set(token, {
    ...data,
    lastFetchedAt: Date.now()
  });

  // advance global cursor if possible
  if (data.lastUpdated) {
    if (
      !lastTokenSyncTime ||
      new Date(data.lastUpdated) > new Date(lastTokenSyncTime)
    ) {
      lastTokenSyncTime = data.lastUpdated;
    }
  }
}

function clearToken(token) {
  tokenCache.delete(token);
}

function getAllTokens() {
  return tokenCache;
}


function getLastTokenSyncTime() {
  return lastTokenSyncTime;
}

function updateLastTokenSyncTime(ts) {
  if (!ts) return;

  if (
    !lastTokenSyncTime ||
    new Date(ts) > new Date(lastTokenSyncTime)
  ) {
    lastTokenSyncTime = ts;
  }
}


 //Bulk load (used at bootstrap AND incremental refresh)
function bulkLoadTokens(rows) {
  for (const row of rows) {
    tokenCache.set(row.token, {
      token: row.token,
      userId: row.userId,
      tenantId: row.tenantId,
      lastUpdated: row.lastUpdated,
      lastFetchedAt: Date.now()
    });

    if (row.lastUpdated) {
      updateLastTokenSyncTime(row.lastUpdated);
    }
  }
}

/**
 * Return ANY valid token for a given tenantId
 * Used by cron to fetch applicant batches
 */
function getAnyValidTokenForTenant(tenantId) {
  for (const [, value] of tokenCache) {
    if (value.tenantId === tenantId) {
      return value.token;
    }
  }
  return null;
}

module.exports = {
  getToken,
  hasToken,
  setToken,
  clearToken,
  getAllTokens,
  getAnyValidTokenForTenant,

  getLastTokenSyncTime,
  updateLastTokenSyncTime,
  bulkLoadTokens
};