/**
 * App lock with Face ID / Touch ID.
 *
 * Uses a device-bound WebAuthn passkey purely as a local unlock gate: the
 * credential never leaves the device and no server verification is needed,
 * because the user is already authenticated with the backend. The lock only
 * protects the on-screen data after the app is (re)opened.
 */

const STORAGE_KEY = "pagopilot.applock.credential";
const SESSION_KEY = "pagopilot.applock.unlocked";

export function biometricsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

export function lockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(STORAGE_KEY);
}

export function isUnlockedForSession(): boolean {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(SESSION_KEY) === "1";
}

export function markUnlocked() {
  window.sessionStorage.setItem(SESSION_KEY, "1");
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer as ArrayBuffer;
}

function randomChallenge(): ArrayBuffer {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes.buffer as ArrayBuffer;
}

/** Enrols the device biometrics and turns the lock on. */
export async function enableLock(email: string): Promise<void> {
  if (!biometricsSupported()) throw new Error("unsupported");
  const userId = randomChallenge();
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: "PagoPilot", id: window.location.hostname },
      user: { id: userId, name: email || "PagoPilot", displayName: email || "PagoPilot" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("cancelled");
  window.localStorage.setItem(STORAGE_KEY, toBase64Url(credential.rawId));
  markUnlocked();
}

/** Prompts Face ID / Touch ID and unlocks the app for this session. */
export async function unlockWithBiometrics(): Promise<void> {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    markUnlocked();
    return;
  }
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: [{ type: "public-key", id: fromBase64Url(stored) }],
      userVerification: "required",
      timeout: 60_000,
    },
  });
  if (!assertion) throw new Error("cancelled");
  markUnlocked();
}

export function disableLock() {
  window.localStorage.removeItem(STORAGE_KEY);
  markUnlocked();
}
