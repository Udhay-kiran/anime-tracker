const express = require("express");
const { getExternalHighlights } = require("../controllers/externalController");

const router = express.Router();

router.get("/highlights", getExternalHighlights);

module.exports = router;
