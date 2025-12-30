const dbPool = require("../db/db");

/**
 * Fetch FULL manager → reportees mapping
 * NO incremental
 * NO limit
 * Loaded once at server startup
 *
 * Returns:
 * Map<managerUserId, number[]>
 */
async function fetchAllTeams() {
  const connection = await dbPool.getConnection();

  try {
    const [rows] = await connection.query(`
      SELECT
        rmUserId,
        sellerUserId
      FROM icrd_sellercompanyrepusers
    `);

    const teamMap = new Map();

    for (const row of rows) {
      if (!teamMap.has(row.rmUserId)) {
        teamMap.set(row.rmUserId, []);
      }
      teamMap.get(row.rmUserId).push(row.sellerUserId);
    }

    return teamMap;
  } finally {
    connection.release();
  }
}

module.exports = {
  fetchAllTeams
};