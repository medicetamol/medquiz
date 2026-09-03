import type { PYQQuestion } from "../types";

const SITE_ORIGIN = "https://medicetamol.github.io";

export function getSiteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

export function formatQuestionForShare(question: PYQQuestion): string {
  const options = question.options
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
    .join("\n");

  return `🩺 mediceTaMol\n\n${question.question}\n\n${options}\n\n📌 Directly solve here:`;
}

export type ShareResult = "shared" | "copied" | "failed";

interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

export async function shareOrCopy({
  title,
  text,
  url,
}: SharePayload): Promise<ShareResult> {
  const shareText = url ? `${text}\n${url}` : text;

  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text: shareText,
      });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(shareText);
    return "copied";
  } catch {
    return "failed";
  }
}