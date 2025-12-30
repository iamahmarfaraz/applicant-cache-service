const dbPool = require("../db/db");

const LNG_ID = 1;

async function fetchApplicantsBatch({ token, lastSyncTime }) {
  const input = {
    startPage: 1,
    limit: 1000
  };

  if (lastSyncTime) {
    input.lastTimeStamp = lastSyncTime;
  }

  const connection = await dbPool.getConnection();

  try {
    const [resultSets] = await connection.query(
      "CALL icrWeb_get_applicantView_v3(?, ?, ?, ?)",
      [
        token,
        LNG_ID,
        JSON.stringify(input),
        process.env.DB_SECRET_KEY
      ]
    );

    return resultSets[0] || [];
  } finally {
    connection.release();
  }
}

module.exports = {
  fetchApplicantsBatch
};