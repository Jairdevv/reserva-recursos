export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function databaseCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}
