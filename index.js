const express = require("express");
const cors = require("cors");

const applicantRoutes = require("./routes/applicant.routes");
const { startApplicantCron } = require("./cron/applicantSync.cron");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/applicants", applicantRoutes);

startApplicantCron();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Application Cache Service running on port ${PORT}`);
});