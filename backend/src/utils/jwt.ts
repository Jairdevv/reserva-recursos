import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";

export const generateJWT = (payload:JwtPayload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};
