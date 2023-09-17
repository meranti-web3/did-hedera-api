import crypto from "crypto";
import envVars from "../services/envVars";

export function encrypt(plainText: string, key = envVars.CRYPTO_SECRET) {
  const cipher = crypto.createCipheriv(
    "aes-128-ecb",
    crypto.createHash("sha256").update(String(key)).digest("base64").substr(0, 16),
    null
  );
  return Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]).toString("base64");
}

export function decrypt(cipherText: string, key = envVars.CRYPTO_SECRET, outputEncoding = "utf8") {
  const cipher = crypto.createDecipheriv(
    "aes-128-ecb",
    crypto.createHash("sha256").update(String(key)).digest("base64").substr(0, 16),
    null
  );
  return Buffer.concat([cipher.update(cipherText, "base64"), cipher.final()]).toString("base64");
}
