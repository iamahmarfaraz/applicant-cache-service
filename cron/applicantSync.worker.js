const { fetchApplicantsBatch } = require("../services/applicant.service");
const {
  getOrCreateTenant,
  markTenantIdle,
  mergeRows,
  SYNC_STATUS
} = require("../cache/applicationCache");

/**
 * Batch-driven background sync
 * - No cron
 * - No timers
 * - Runs fully async
 * - Stops when DB returns < 1000 rows
 */
async function startApplicantBackgroundWorker(token) {
  const tenant = getOrCreateTenant(token);

  // Safety guard
  if (tenant.syncStatus === SYNC_STATUS.RUNNING) {
    return;
  }

  tenant.syncStatus = SYNC_STATUS.RUNNING;

  try {
    while (true) {
      const rows = await fetchApplicantsBatch({
        token,
        lastSyncTime: tenant.lastSyncTime
      });

      if (!rows || rows.length === 0) {
        break;
      }

      mergeRows(token, rows);

      // Last batch
      if (rows.length < 1000) {
        break;
      }

      // Yield control back to event loop
      await new Promise(resolve => setImmediate(resolve));
    }
  } catch (err) {
    console.error(
      `[BACKGROUND WORKER ERROR] token=${token}`,
      err
    );
  } finally {
    markTenantIdle(token);
  }
}

module.exports = {
  startApplicantBackgroundWorker
};