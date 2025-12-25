const tenantCacheMap = new Map();

const SYNC_STATUS = {
  IDLE: "IDLE",
  RUNNING: "RUNNING"
};

function getOrCreateTenant(token) {
  if (!tenantCacheMap.has(token)) {
    tenantCacheMap.set(token, {
      parentSellerCode: null,
      recordsMap: new Map(),
      recordsList: [],
      lastSyncTime: null,
      syncStatus: SYNC_STATUS.IDLE,
      lastAccessedAt: Date.now()
    });
  }

  const tenant = tenantCacheMap.get(token);

  // update access time on every use
  tenant.lastAccessedAt = Date.now();

  return tenant;
}

function getAllTenants() {
  return tenantCacheMap;
}

function markTenantRunning(token) {
  const tenant = getOrCreateTenant(token);
  tenant.syncStatus = SYNC_STATUS.RUNNING;
}

function markTenantIdle(token) {
  const tenant = getOrCreateTenant(token);
  tenant.syncStatus = SYNC_STATUS.IDLE;
}

function mergeRows(token, rows) {
  const tenant = getOrCreateTenant(token);

  for (const row of rows) {
    if (!tenant.parentSellerCode) {
      tenant.parentSellerCode = row.parentSellerCode;
    }

    const existing = tenant.recordsMap.get(row.alertId);

    if (!existing) {
      tenant.recordsMap.set(row.alertId, row);
      tenant.recordsList.push(row);
    } else {
      tenant.recordsMap.set(row.alertId, row);
      const idx = tenant.recordsList.findIndex(
        r => r.alertId === row.alertId
      );
      if (idx !== -1) {
        tenant.recordsList[idx] = row;
      }
    }

    if (
      !tenant.lastSyncTime ||
      new Date(row.luDate) > new Date(tenant.lastSyncTime)
    ) {
      tenant.lastSyncTime = row.luDate;
    }
  }
}

function readPage(token, limit, cursor) {
  const tenant = getOrCreateTenant(token);

  const start = cursor || 0;
  const end = start + limit;

  const data = tenant.recordsList.slice(start, end);
  const nextCursor = end < tenant.recordsList.length ? end : null;

  return {
    data,
    nextCursor,
    syncStatus: tenant.syncStatus
  };
}

module.exports = {
  getOrCreateTenant,
  getAllTenants,
  markTenantRunning,
  markTenantIdle,
  mergeRows,
  readPage,
  SYNC_STATUS
};