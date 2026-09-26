import type { JwtPayload } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export {};
