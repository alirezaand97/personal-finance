/**
 * قفل محلی برنامه — کاملاً سمت کلاینت و بدون سرور.
 *
 * دو روش پشتیبانی می‌شود:
 *  ۱) پین عددی: هش SHA-256 آن در localStorage ذخیره می‌شود (خود پین ذخیره نمی‌شود).
 *  ۲) اثرانگشت/چهره: با WebAuthn (Platform Authenticator) — همان چیزی که
 *     مرورگر برای ورود بدون رمز استفاده می‌کند. این قابلیت فقط روی HTTPS
 *     (یا localhost) و در مرورگرهایی که از آن پشتیبانی می‌کنند کار می‌کند.
 *
 * هیچ‌کدام از این‌ها به سروری فرستاده نمی‌شود؛ همه‌چیز روی همین دستگاه/مرورگر
 * ذخیره می‌گردد. یعنی اگر کاربر مرورگر را عوض کند یا کش را پاک کند، قفل هم
 * از بین می‌رود (که طبیعی و مطلوب است، چون این فقط یک قفل صفحه است، نه رمزنگاری
 * واقعی داده‌ها).
 */

const ENABLED_KEY = "hamrah:lock:enabled";
const PIN_HASH_KEY = "hamrah:lock:pin-hash";
const BIOMETRIC_ID_KEY = "hamrah:lock:biometric-credential-id";

async function sha256Hex(text: string) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToBase64Url(buf: ArrayBuffer) {
  let binary = "";
  new Uint8Array(buf).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuf(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const binary = atob(b64 + pad);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

/** آیا کاربر قفل برنامه را فعال کرده (پین یا بیومتریک، هر کدام)؟ */
export function isAppLockEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export function hasPin() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PIN_HASH_KEY);
}

export function hasBiometric() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(BIOMETRIC_ID_KEY);
}

/** ذخیره‌ی پین جدید (۴ رقمی یا بیشتر) */
export async function setPin(pin: string) {
  localStorage.setItem(PIN_HASH_KEY, await sha256Hex(pin));
  localStorage.setItem(ENABLED_KEY, "1");
}

export async function verifyPin(pin: string) {
  const hash = localStorage.getItem(PIN_HASH_KEY);
  if (!hash) return false;
  return (await sha256Hex(pin)) === hash;
}

export function removePin() {
  localStorage.removeItem(PIN_HASH_KEY);
}

/** غیرفعال کردن کامل قفل (هم پین و هم بیومتریک) */
export function disableAppLock() {
  localStorage.removeItem(ENABLED_KEY);
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(BIOMETRIC_ID_KEY);
}

export function isWebAuthnSupported() {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

/** آیا دستگاه فعلی سنسور بیومتریک (اثرانگشت/چهره) دارد؟ */
export async function isBiometricAvailable() {
  if (!isWebAuthnSupported()) return false;
  try {
    return await (
      window.PublicKeyCredential as unknown as {
        isUserVerifyingPlatformAuthenticatorAvailable: () => Promise<boolean>;
      }
    ).isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** ثبت اثرانگشت/چهره‌ی کاربر برای این دستگاه/مرورگر */
export async function registerBiometric() {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "همراه مالی" },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: "hamrah-finance-user",
        displayName: "کاربر همراه مالی",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("ثبت بیومتریک ناموفق بود");

  localStorage.setItem(BIOMETRIC_ID_KEY, bufToBase64Url(credential.rawId));
  localStorage.setItem(ENABLED_KEY, "1");
}

/** درخواست تایید هویت با اثرانگشت/چهره؛ true اگر موفق بود */
export async function verifyBiometric() {
  const id = localStorage.getItem(BIOMETRIC_ID_KEY);
  if (!id) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [
          { id: base64UrlToBuf(id), type: "public-key" },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    // کاربر انصراف داد یا سنسور موفق نشد
    return false;
  }
}

export function removeBiometric() {
  localStorage.removeItem(BIOMETRIC_ID_KEY);
}

/**
 * قفل بودنِ session فعلی (نه هر رفرش).
 * از sessionStorage استفاده می‌کنیم: با رفرش صفحه پاک نمی‌شود، اما با
 * بسته‌شدن تب/مرورگر پاک می‌شود — یعنی دفعه‌ی بعد که کاربر واقعاً «وارد»
 * برنامه می‌شود، دوباره قفل نشان داده خواهد شد.
 */
const SESSION_UNLOCK_KEY = "hamrah:lock:session-unlocked";

export function hasUnlockedThisSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) === "1";
}

export function markUnlockedThisSession() {
  sessionStorage.setItem(SESSION_UNLOCK_KEY, "1");
}

export function clearSessionUnlock() {
  sessionStorage.removeItem(SESSION_UNLOCK_KEY);
}
