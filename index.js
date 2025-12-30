// index.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const applicantRoutes = require("./routes/applicant.routes");
const { startApplicantCron } = require("./cron/applicantSync.cron");

// CACHES
const { bulkLoadTokens } = require("./cache/tokenCache");
const { bulkLoadTeams } = require("./cache/teamCache");

// SERVICES
const { fetchTokensIncremental } = require("./services/token.service");
const { fetchAllTeams } = require("./services/team.service");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/applicants", applicantRoutes);

async function bootstrap() {
  try {
    console.log("Bootstrapping Token Cache...");

    const tokens = await fetchTokensIncremental(null);
    bulkLoadTokens(tokens);

    console.log(`Token Cache Loaded: ${tokens.length} tokens`);

    console.log("Bootstrapping Team Cache...");

    const teamMap = await fetchAllTeams();
    bulkLoadTeams(teamMap);

    console.log(`Team Cache Loaded: ${teamMap.size} managers`);

    // Start cron ONLY after caches are ready
    startApplicantCron();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Application Cache Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();