import type { FileUIPart } from "ai";

/**
 * Convert a blob URL to a data URL so it survives page context changes.
 */
export async function convertBlobUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Convert all blob URLs in file parts to data URLs.
 */
export async function convertFilesForSubmission(
  files: (FileUIPart & { id: string })[],
): Promise<FileUIPart[]> {
  return Promise.all(
    files.map(async ({ id: _id, ...item }) => {
      if (item.url?.startsWith("blob:")) {
        const dataUrl = await convertBlobUrlToDataUrl(item.url);
        return { ...item, url: dataUrl ?? item.url };
      }
      return item;
    }),
  );
}

/**
 * Capture a screenshot of the user's screen.
 */
export async function captureScreenshot(): Promise<File | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    return null;
  }

  let stream: MediaStream | null = null;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: true,
    });

    video.srcObject = stream;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load screen stream"));
    });

    await video.play();

    const { videoWidth: width, videoHeight: height } = video;
    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    if (!blob) return null;

    const timestamp = new Date()
      .toISOString()
      .replaceAll(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");

    return new File([blob], `screenshot-${timestamp}.png`, {
      lastModified: Date.now(),
      type: "image/png",
    });
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
    video.pause();
    video.srcObject = null;
  }
}

/**
 * Check if a file matches an accept filter (e.g. "image/*").
 */
export function matchesAcceptFilter(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  return accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((pattern) => {
      if (pattern.endsWith("/*")) {
        return file.type.startsWith(pattern.slice(0, -1));
      }
      return file.type === pattern;
    });
}
