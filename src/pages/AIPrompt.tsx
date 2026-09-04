import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { findQuestion } from "../data/questions";

const MASTER_PROMPT = `You are a medical student in an entrance exam (NEET PG & INICET).

Solve the following MCQ using the approach described below.

1. One-line problem representation: age/sex + key symptom/sign + key discriminator(s).

2. Key clues only (max 3–5 bullets): highlight the discriminators; ignore fluff.

3. Solve each question using an elimination-first approach as if you do NOT know the correct answer. Do not answer according to the colour marked in the question. Justify every elimination using exam-relevant logic.

4. Stepwise elimination of options: eliminate options one by one with crisp reasons; include “why tempting but wrong” for close distractors.

Keep the response concise and focused on high-yield, exam-relevant points.

Use standard medical terminology.`;

export default function AIPrompt() {
  const { questionId } = useParams();
  const question = useMemo(() => findQuestion(questionId ?? ""), [questionId]);

  if (!question) {
    return (
      <main>
        <h1>Question not found</h1>
      </main>
    );
  }

  return (
    <main>
      <h1>Use this Prompt to solve the MCQ</h1>

      <p>{MASTER_PROMPT}</p>

      <h2>MCQ</h2>
      <p>{question.question}</p>

      <div>
        {question.options.map((option, index) => (
          <p key={index}>
            {String.fromCharCode(65 + index)}. {option}
          </p>
        ))}
      </div>
    </main>
  );
}