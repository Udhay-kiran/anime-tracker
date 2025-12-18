const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-please-change";
const COOKIE_NAME = "token";

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  return null;
}

async function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      dob: user.dob,
    };

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(500).json({ message: "Failed to verify session" });
  }
}

function issueToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = { requireAuth, issueToken, getToken, COOKIE_NAME };
