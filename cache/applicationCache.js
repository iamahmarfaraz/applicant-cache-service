const tenantCacheMap = new Map();

const SYNC_STATUS = {
  IDLE: "IDLE",
  RUNNING: "RUNNING"
};

function getOrCreateTenant(tenantId) {
  if (!tenantCacheMap.has(tenantId)) {
    tenantCacheMap.set(tenantId, {
      parentSellerCode: null,
      recordsMap: new Map(),   // alertId -> row
      recordsList: [],         // flat array
      lastSyncTime: null,
      syncStatus: SYNC_STATUS.IDLE,
      lastAccessedAt: Date.now()
    });
  }

  const tenant = tenantCacheMap.get(tenantId);
  tenant.lastAccessedAt = Date.now();
  return tenant;
}

function getAllTenants() {
  return tenantCacheMap;
}

function markTenantRunning(tenantId) {
  const tenant = getOrCreateTenant(tenantId);
  tenant.syncStatus = SYNC_STATUS.RUNNING;
}

function markTenantIdle(tenantId) {
  const tenant = getOrCreateTenant(tenantId);
  tenant.syncStatus = SYNC_STATUS.IDLE;
}

/**
 * Merge applicant rows into tenant cache
 * - keyed by alertId
 * - updates lastSyncTime via luDate
 */
function mergeRows(tenantId, rows) {
  const tenant = getOrCreateTenant(tenantId);

  
  if (!tenant.__logged && rows.length > 0) {
    // console.log("SAMPLE APPLICANT ROW:", rows[0]);
    tenant.__logged = true;
  }

  for (const row of rows) {
    if (!tenant.parentSellerCode && row.parentSellerCode) {
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

/**
 * READ WITH AUTHORIZZATION--
 * Rules:
 * 1. crUserId === 0 → SYSTEM / LEGACY → ALWAYS VISIBLE
 * 2. crUserId > 0  → must be in allowedUserIds
 */
function readPage({
  tenantId,
  allowedUserIds,
  limit,
  cursor
}) {
  const tenant = getOrCreateTenant(tenantId);

  let filtered = tenant.recordsList;

  if (allowedUserIds && allowedUserIds.length > 0) {
    const allowedSet = new Set(allowedUserIds);

    filtered = filtered.filter(row => {
      const ownerUserId =
        row.crUserId ??
        row.createdBy ??
        row.createdByUserId ??
        row.userId ??
        row.tuserid ??
        0;

      if (ownerUserId === 0) return true;
      return allowedSet.has(ownerUserId);
    });
  }

  const start = cursor || 0;
  const end = start + limit;

  const pageData = filtered.slice(start, end);
  const nextCursor = end < filtered.length ? end : null;

  return {
    data: pageData,
    nextCursor,
    syncStatus: tenant.syncStatus,
    isPartial: tenant.syncStatus === SYNC_STATUS.RUNNING
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