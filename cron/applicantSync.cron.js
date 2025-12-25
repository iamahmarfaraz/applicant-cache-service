const cron = require("node-cron");
const { fetchApplicantsBatch } = require("../services/applicant.service");
const {
  getAllTenants,
  markTenantIdle,
  mergeRows,
  SYNC_STATUS
} = require("../cache/applicationCache");

let cronRunning = false;

function startApplicantCron() {
  cron.schedule("*/5 * * * * *", async () => {
    if (cronRunning) return;
    cronRunning = true;

    try {
      const tenants = getAllTenants();

      for (const [token, tenant] of tenants) {
        if (tenant.syncStatus !== SYNC_STATUS.RUNNING) continue;

        const rows = await fetchApplicantsBatch({
          token,
          lastSyncTime: tenant.lastSyncTime
        });

        if (!rows || rows.length === 0) {
          markTenantIdle(token);
          continue;
        }

        mergeRows(token, rows);

        if (rows.length < 1000) {
          markTenantIdle(token);
        }
      }
    } catch (err) {
      console.error("Cron error:", err);
    } finally {
      cronRunning = false;
    }
  });
}

module.exports = {
  startApplicantCron
};