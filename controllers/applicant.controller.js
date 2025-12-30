const {
  getOrCreateTenant,
  markTenantRunning,
  readPage
} = require("../cache/applicationCache");

const PAGE_SIZE = 50;

const getApplicants = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const allowedUserIds = req.allowedUserIds || [];
    const cursor = Number(req.query.cursor || 0);

    const tenant = getOrCreateTenant(tenantId);

    if (tenant.syncStatus === "IDLE") {
      markTenantRunning(tenantId);
    }

    const result = readPage({
      tenantId,
      allowedUserIds,
      limit: PAGE_SIZE,
      cursor
    });

    return res.status(200).json({
      message: "Get Application View Successful",
      ...result
    });
  } catch (err) {
    console.error("GetApplicants error:", err);
    return res.status(500).json({
      message: "Failed to fetch applications"
    });
  }
};

module.exports = {
  getApplicants
};