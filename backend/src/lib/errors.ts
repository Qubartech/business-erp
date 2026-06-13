export class HttpError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const BadRequest = (m: string, e?: Record<string, string[]>) => new HttpError(400, m, e);
export const Unauthorized = (m = "Unauthorized") => new HttpError(401, m);
export const Forbidden = (m = "Forbidden") => new HttpError(403, m);
export const NotFound = (m = "Not found") => new HttpError(404, m);
export const Conflict = (m: string) => new HttpError(409, m);
