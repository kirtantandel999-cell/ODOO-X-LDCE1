import jwt from "jsonwebtoken";

/**
 * Middleware to protect routes with JWT.
 * Expects: Authorization: Bearer <token>
 * Attaches decoded payload to req.user = { id, username, iat, exp }
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please log in again." });
    }
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};
