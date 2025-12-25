const {
  getOrCreateTenant,
  markTenantRunning,
  readPage,
} = require("../cache/applicationCache");

const PAGE_SIZE = 50;

const getApplicants = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  const cursor = Number(req.query.cursor || 0);

  const tenant = getOrCreateTenant(token);

  if (tenant.syncStatus === "IDLE") {
    markTenantRunning(token);
  }

  const result = readPage(token, PAGE_SIZE, cursor);

  res.json(result);
};

module.exports = {
  getApplicants,
};
