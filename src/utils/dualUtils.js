import crypto from "crypto";

export default function generateShortCode(length = 6) {
    return crypto
        .randomBytes(length)
        .toString("base64")
        .replace(/[+/=]/g, "")
        .slice(0, length);
}