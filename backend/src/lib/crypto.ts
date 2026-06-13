import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const sha256 = (input: string) => crypto.createHash("sha256").update(input).digest("hex");
