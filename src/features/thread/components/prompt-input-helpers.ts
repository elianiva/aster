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
 * Check if a file matches an accept filter (e.g. "image/*").
 */
export function matchesAcceptFilter(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  return accept
    .split(",")
    .flatMap((s) => {
      const trimmed = s.trim();
      return trimmed ? [trimmed] : [];
    })
    .some((pattern) => {
      if (pattern.endsWith("/*")) {
        return file.type.startsWith(pattern.slice(0, -1));
      }
      return file.type === pattern;
    });
}
