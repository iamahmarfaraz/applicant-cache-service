const express = require("express");
const { getApplicants } = require("../controllers/applicant.controller");
const authMiddleware = require("../middleware/auth.middleware");
const teamMiddleware = require("../middleware/team.middleware");

const router = express.Router();

router.get("/", authMiddleware, teamMiddleware, getApplicants);

module.exports = router;