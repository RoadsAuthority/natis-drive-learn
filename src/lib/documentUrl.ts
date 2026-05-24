export function resolveDocumentUrl(
  apiBase: string,
  filePath: string | null | undefined,
  inlineData: string | null | undefined
): string | null {
  if (inlineData?.startsWith("data:")) {
    return inlineData;
  }
  if (filePath) {
    return `${apiBase.replace(/\/$/, "")}${filePath}`;
  }
  return null;
}

export function isImageDocumentUrl(url: string) {
  return (
    url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url.split("?")[0] ?? "")
  );
}

export function isPdfDocumentUrl(url: string) {
  return url.startsWith("data:application/pdf") || /\.pdf(\?|$)/i.test(url.split("?")[0] ?? "");
}
