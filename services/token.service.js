const dbPool = require("../db/db");

/**
 * Incremental token fetch
 * SOURCE OF TRUTH:
 * tenantId MUST be resolved using fn_get_login_user_sellerCode
 * (same logic used internally by icrWeb_get_applicantView_v3)
 *
 * - If lastTimeStamp = null → fetch ALL
 * - Else → fetch only updated tokens
 * - NO LIMIT
 */
async function fetchTokensIncremental(lastTimeStamp) {
  const connection = await dbPool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT 
        ld.token AS token,
        ld.tuserid AS userId,
        fn_get_login_user_sellerCode(u.tid) AS tenantId,
        GREATEST(u.LUDate, ld.LUDate) AS lastUpdated
      FROM tLoggedDevices ld
      JOIN tusers u 
        ON u.tid = ld.tuserid
      WHERE ld.status = 1
        AND (
          ? IS NULL
          OR GREATEST(u.LUDate, ld.LUDate) > ?
        )
      `,
      [lastTimeStamp, lastTimeStamp]
    );

    return rows;
  } finally {
    connection.release();
  }
}

module.exports = {
  fetchTokensIncremental
};