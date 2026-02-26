import { createHash } from "node:crypto";

const HIBP_RANGE_API = "https://api.pwnedpasswords.com/range";

function sha1Uppercase(input: string): string {
  return createHash("sha1").update(input, "utf8").digest("hex").toUpperCase();
}

export async function isPasswordCompromised(password: string): Promise<boolean> {
  if (!password) return false;

  const hash = sha1Uppercase(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`${HIBP_RANGE_API}/${prefix}`, {
    headers: {
      "Add-Padding": "true",
      "User-Agent": "sigmagit-password-check",
    },
  });

  if (!res.ok) {
    // Fail open: don't block users on upstream API outages.
    return false;
  }

  const body = await res.text();
  const lines = body.split("\n");

  for (const line of lines) {
    const [remoteSuffix] = line.trim().split(":");
    if (remoteSuffix?.toUpperCase() === suffix) {
      return true;
    }
  }

  return false;
}

