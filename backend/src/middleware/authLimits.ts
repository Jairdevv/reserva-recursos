import { rateLimit } from "express-rate-limit";

export const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Demasiados intentos. Inténtalo de nuevo más tarde.",
  },
});

export const registroLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Demasiados registros. Inténtalo de nuevo más tarde.",
  },
});
