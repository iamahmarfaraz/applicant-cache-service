const express = require("express");

const {
  getApplicants
} = require("../controllers/applicant.controller");

const router = express.Router();

router.get("/", getApplicants);

module.exports = router;