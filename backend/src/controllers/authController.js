const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { issueToken, COOKIE_NAME } = require("../middleware/auth");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  dob: user.dob,
});

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeUsername = (username = "") => username.trim().toLowerCase();
const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

async function register(req, res) {
  const { email, password, username, dob } = req.body || {};
  if (!email || !password || !username || !dob) {
    return res
      .status(400)
      .json({
        message: "Username, email, password, and date of birth are required",
      });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  const parsedDob = new Date(dob);

  if (Number.isNaN(parsedDob.getTime())) {
    return res.status(400).json({ message: "Invalid date of birth" });
  }

  try {
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      const reason =
        existing.email === normalizedEmail
          ? "Email already registered"
          : "Username already taken";
      return res.status(409).json({ message: reason });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      dob: parsedDob,
      passwordHash,
    });

    const token = issueToken(user);

    return res
      .cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
      .status(201)
      .json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
}

async function login(req, res) {
  const { password } = req.body || {};
  const identifier = (
    req.body?.identifier ||
    req.body?.email ||
    req.body?.username ||
    ""
  )
    .trim()
    .toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ message: "Identifier and password are required" });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = issueToken(user);

    return res
      .cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
      .json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
}

async function me(req, res) {
  if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load user" });
  }
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).send();
}

module.exports = { register, login, me, logout };
