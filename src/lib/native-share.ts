/**
 * Shares a file via the OS share sheet — native through Capacitor's
 * Filesystem + Share plugins, web through the Web Share API where the
 * browser supports sharing files at all.
 */
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

export function nativeShareSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/** Writes a blob to the app's cache and opens the native share sheet. */
export async function shareNativeFile(blob: Blob, filename: string, title?: string): Promise<void> {
  const base64 = await blobToBase64(blob);
  const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
  await Share.share({ url: uri, title: title ?? filename });
}

/** Whether the Web Share API is available and can share this specific file. */
export function webShareSupportsFile(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

/**
 * Saves a file. Native has no silent write access to public storage, so it
 * opens the share sheet instead (same as shareNativeFile — "Save to Files"
 * is one of the options there). On web, a plain `<a download>` click only
 * works reliably when the anchor is actually attached to the DOM, and the
 * blob URL must outlive the click, not be revoked immediately after it.
 */
export async function saveFile(blob: Blob, filename: string): Promise<void> {
  if (nativeShareSupported()) {
    await shareNativeFile(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Opens a URL for viewing. Native uses an in-app Chrome Custom Tab (an
 * overlay on top of the app, one tap back) instead of fully switching away
 * to a separate Chrome window.
 */
export async function openUrl(url: string): Promise<void> {
  if (nativeShareSupported()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
