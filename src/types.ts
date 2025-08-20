export type Subject = string;
export type Subtopic = string;

export type Choice = {
  id: string;        // 'A' | 'B' | 'C' | 'D' etc.
  text: string;
};

export type QAItem = {
  id: string;                       // unique id
  exam: "NEET PG" | "INICET" | string;
  year?: number;
  subject: Subject;
  subtopic?: Subtopic;
  stem: string;                     // question text
  choices: Choice[];
  answer: string;                   // id of correct choice
  explanation?: string;
  tags?: string[];
  image?: string;                   // optional image url
  difficulty?: "Easy" | "Medium" | "Hard";
};

export type Bank = {
  meta: {
    title: string;
    updated?: string;
    source?: string;
  };
  items: QAItem[];
};
