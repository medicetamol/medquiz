import type { DailyActivity, QuestionProgress, QuizResult } from "../types";

const DB_NAME = "medicetamol-db";
const DB_VERSION = 2;
const PROGRESS = "questionProgress";
const ACTIVITY = "dailyActivity";
const QUIZZES = "quizResults";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROGRESS)) {
        db.createObjectStore(PROGRESS, { keyPath: "qid" });
      }
      if (!db.objectStoreNames.contains(ACTIVITY)) {
        db.createObjectStore(ACTIVITY, { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains(QUIZZES)) {
        const store = db.createObjectStore(QUIZZES, { keyPath: "finishedAt" });
        store.createIndex("startedAt", "startedAt");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void
): Promise<T> {
  return openDB().then((db) => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    action(transaction.objectStore(storeName), resolve, reject);
    transaction.onerror = () => reject(transaction.error);
  }));
}

export async function getQuestionProgress(qid: string): Promise<QuestionProgress | null> {
  return tx<QuestionProgress | null>(PROGRESS, "readonly", (store, resolve, reject) => {
    const req = store.get(qid);
    req.onsuccess = () => resolve((req.result as QuestionProgress | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllQuestionProgress(): Promise<QuestionProgress[]> {
  return tx<QuestionProgress[]>(PROGRESS, "readonly", (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QuestionProgress[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveQuestionProgress(progress: QuestionProgress): Promise<void> {
  return tx<void>(PROGRESS, "readwrite", (store, resolve) => {
    store.put(progress);
    resolve();
  });
}

export async function toggleBookmark(qid: string): Promise<QuestionProgress> {
  const current = await getQuestionProgress(qid);
  const next: QuestionProgress = current ?? {
    qid,
    bookmarked: false,
    directCorrect: false,
    directIncorrect: false,
    firstIncorrect: false,
    attempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0
  };
  next.bookmarked = !next.bookmarked;
  await saveQuestionProgress(next);
  return next;
}

/**
 * Direct QBank attempt:
 * correctness is updated here only.
 * firstIncorrect is intentionally never cleared.
 */
export async function recordDirectAnswer(qid: string, correct: boolean): Promise<QuestionProgress> {
  const current = await getQuestionProgress(qid);
  const next: QuestionProgress = current ?? {
    qid,
    bookmarked: false,
    directCorrect: false,
    directIncorrect: false,
    firstIncorrect: false,
    attempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0
  };

  next.attempts += 1;
  next.lastAnsweredAt = new Date().toISOString();

  if (correct) {
    next.directCorrect = true;
    next.correctAttempts += 1;
  } else {
    next.directIncorrect = true;
    next.firstIncorrect = true;
    next.incorrectAttempts += 1;
  }

  await saveQuestionProgress(next);
  await recordDailyActivity(correct);
  return next;
}

/**
 * Custom-module answers deliberately do NOT touch correctness/progress.
 */
export async function recordDailyActivity(correct: boolean): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const current = await tx<DailyActivity | null>(ACTIVITY, "readonly", (store, resolve, reject) => {
    const req = store.get(date);
    req.onsuccess = () => resolve((req.result as DailyActivity | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });

  const next: DailyActivity = current ?? { date, questions: 0, correct: 0, incorrect: 0 };
  next.questions += 1;
  if (correct) next.correct += 1;
  else next.incorrect += 1;

  await tx<void>(ACTIVITY, "readwrite", (store, resolve) => {
    store.put(next);
    resolve();
  });
}

export async function getDailyActivity(): Promise<DailyActivity[]> {
  return tx<DailyActivity[]>(ACTIVITY, "readonly", (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as DailyActivity[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveQuizResult(result: QuizResult): Promise<void> {
  return tx<void>(QUIZZES, "readwrite", (store, resolve) => {
    store.put(result);
    resolve();
  });
}

export async function getQuizResults(): Promise<QuizResult[]> {
  return tx<QuizResult[]>(QUIZZES, "readonly", (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QuizResult[]);
    req.onerror = () => reject(req.error);
  });
                                              }
                 
