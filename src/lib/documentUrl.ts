export type AdminDocumentKind = "id" | "passport" | "face" | "doctor";

export function adminDocumentApiUrl(apiBase: string, profileId: string, kind: AdminDocumentKind) {
  return `${apiBase.replace(/\/$/, "")}/api/admin/documents/${profileId}/${kind}`;
}

export function candidateHasDocument(
  hasFlag: boolean | undefined,
  path: string | null | undefined,
  inlineData: string | null | undefined
) {
  return Boolean(hasFlag || path || inlineData?.startsWith("data:"));
}

export function isImageDocumentUrl(url: string) {
  return (
    url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url.split("?")[0] ?? "")
  );
}

export function isPdfDocumentUrl(url: string) {
  return url.startsWith("data:application/pdf") || /\.pdf(\?|$)/i.test(url.split("?")[0] ?? "");
}
