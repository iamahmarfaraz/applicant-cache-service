const cron = require("node-cron");
const { fetchApplicantsBatch } = require("../services/applicant.service");
const {
  getAllTenants,
  markTenantIdle,
  mergeRows,
  SYNC_STATUS
} = require("../cache/applicationCache");
const { getAnyValidTokenForTenant } = require("../cache/tokenCache");

let cronRunning = false;

function startApplicantCron() {
  cron.schedule("*/5 * * * * *", async () => {
    if (cronRunning) return;
    cronRunning = true;

    try {
      const tenants = getAllTenants();

      for (const [tenantId, tenant] of tenants) {
        if (tenant.syncStatus !== SYNC_STATUS.RUNNING) continue;

        const token = getAnyValidTokenForTenant(tenantId);

        //console.log("CRON TENANT:", tenantId, "TOKEN:", token);

        if (!token) {
          markTenantIdle(tenantId);
          continue;
        }

        const rows = await fetchApplicantsBatch({
          token,
          lastSyncTime: tenant.lastSyncTime
        });

        //console.log("ROWS FETCHED:", rows.length);

        if (!rows.length) {
          markTenantIdle(tenantId);
          continue;
        }

        mergeRows(tenantId, rows);

        if (rows.length < 1000) {
          markTenantIdle(tenantId);
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