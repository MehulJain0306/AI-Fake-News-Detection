import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const protect = (req, res, next) => {
  try {
    console.log("===== AUTH MIDDLEWARE =====");
    console.log("Authorization Header:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid Authorization header received.");
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token:", token);

    const decoded = jwt.verify(token, env.jwtSecret);
    console.log("Decoded JWT:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT Error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};