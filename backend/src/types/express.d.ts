import type { JwtPayload } from "./auth.types";

export declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}
