const express = require("express");
const { register, login, me, logout, deleteMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", logout);
router.delete("/me", requireAuth, deleteMe);

module.exports = router;
