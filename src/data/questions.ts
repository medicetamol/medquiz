import type { Exam, PYQExplanation, PYQQuestion } from "../types";

const questionModules = import.meta.glob("../../PYQs/*/*/questions.json", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const explanationModules = import.meta.glob("../../PYQs/*/*/explanations.json", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

type CompactQuestion = {
  id: string;
  y: number;
  t: string;
  q: string;
  o: string[];
  a: number;
  image?: string;
};

function parseQuestions(
  raw: string,
  exam: Exam,
  subjectId: string
): PYQQuestion[] {
  try {
    const questions: CompactQuestion[] = JSON.parse(raw);

    return questions.map((q) => ({
      id: q.id,
      exam,
      year: q.y,
      subjectId,
      topicId: q.t,
      topicName: q.t,
      question: q.q,
      options: q.o,
      answer: q.a,
      ...(q.image ? { image: q.image } : {}),
    }));
  } catch {
    return [];
  }
}

function parseExplanations(raw: string): PYQExplanation[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function loadQuestions(
  exam: Exam,
  subjectId: string
): PYQQuestion[] {
  const key = Object.keys(questionModules).find(
    (key) =>
      key.includes(`PYQs/${exam}/`) &&
      key.includes(`/${subjectId}/questions.json`)
  );

  return key
    ? parseQuestions(questionModules[key], exam, subjectId)
    : [];
}

export function loadExplanations(
  exam: Exam,
  subjectId: string
): PYQExplanation[] {
  const key = Object.keys(explanationModules).find(
    (key) =>
      key.includes(`PYQs/${exam}/`) &&
      key.includes(`/${subjectId}/explanations.json`)
  );

  return key
    ? parseExplanations(explanationModules[key])
    : [];
}

export function getAllQuestions(exam: Exam): PYQQuestion[] {
  return Object.entries(questionModules)
    .filter(([key]) => key.includes(`PYQs/${exam}/`))
    .flatMap(([key, raw]) => {
      const subjectId =
        key.match(/PYQs\/[^/]+\/([^/]+)\/questions\.json$/)?.[1] ?? "";

      return parseQuestions(raw, exam, subjectId);
    });
}
