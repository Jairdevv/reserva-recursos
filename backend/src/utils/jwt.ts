import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";
import { config } from "../config/env";

export const generateJWT = (payload:JwtPayload) => {
  const token = jwt.sign(payload, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
  return token;
};
