export function getSiteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  return `${window.location.origin}${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function shareOrCopy(payload: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const shareData = {
    title: payload.title,
    text: payload.text,
    ...(payload.url ? { url: payload.url } : {}),
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return "shared";
    }

    const combined = payload.url
      ? `${payload.text}\n\n${payload.url}`
      : payload.text;

    await navigator.clipboard.writeText(combined);
    return "copied";
  } catch {
    return "failed";
  }
}

export function formatQuestionForShare(question: {
  id: string;
  year: number;
  question: string;
  options: string[];
}): string {
  const options = question.options
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
    .join("\n");

  return `${question.question}\n\n${options}\n\nPYQ: ${question.id} • ${question.year}`;
}
