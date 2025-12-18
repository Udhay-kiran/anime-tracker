const express = require("express");
const { getAccountSummary } = require("../controllers/accountController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, getAccountSummary);

module.exports = router;
