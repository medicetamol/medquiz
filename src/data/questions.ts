import type { Exam, PYQExplanation, PYQQuestion } from "../types";

const questionModules = import.meta.glob("../../PYQs/*/*/questions.json", {
  eager: true,
  query: "?raw",
  import: "default"
}) as Record<string, string>;

const explanationModules = import.meta.glob("../../PYQs/*/*/explanations.json", {
  eager: true,
  query: "?raw",
  import: "default"
}) as Record<string, string>;

function parseQuestions(raw: string): PYQQuestion[] {
  try {
    return JSON.parse(raw).questions ?? [];
  } catch {
    return [];
  }
}

function parseExplanations(raw: string): PYQExplanation[] {
  try {
    return JSON.parse(raw).explanations ?? [];
  } catch {
    return [];
  }
}

export function loadQuestions(exam: Exam, subjectId: string): PYQQuestion[] {
  const pathPart = subjectId;
  const key = Object.keys(questionModules).find(
    (key) => key.includes(`/PYQs/${exam}/`) && key.includes(`/${pathPart}/questions.json`)
  );
  return key ? parseQuestions(questionModules[key]) : [];
}

export function loadExplanations(exam: Exam, subjectId: string): PYQExplanation[] {
  const key = Object.keys(explanationModules).find(
    (key) => key.includes(`/PYQs/${exam}/`) && key.includes(`/${subjectId}/explanations.json`)
  );
  return key ? parseExplanations(explanationModules[key]) : [];
}

export function getAllQuestions(exam: Exam): PYQQuestion[] {
  return Object.entries(questionModules)
    .filter(([key]) => key.includes(`/PYQs/${exam}/`))
    .flatMap(([, raw]) => parseQuestions(raw));
    }
