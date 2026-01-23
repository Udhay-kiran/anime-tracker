const express = require("express");
const ContactMessage = require("../models/ContactMessage");

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, message } = req.body || {};

  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 80
  ) {
    return res.status(400).json({ error: "Name must be 2-80 characters." });
  }

  const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (
    !message ||
    typeof message !== "string" ||
    message.trim().length < 5 ||
    message.trim().length > 2000
  ) {
    return res.status(400).json({ error: "Message must be 5-2000 characters." });
  }

  try {
    await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Contact save failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
