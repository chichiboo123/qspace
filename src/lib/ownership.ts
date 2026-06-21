const QUESTIONS_KEY = "qs-my-questions";
const COMMENTS_KEY = "qs-my-comments";

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* storage unavailable, ignore */
  }
}

function addId(key: string, id: string) {
  if (!id) return;
  const ids = readIds(key);
  if (!ids.includes(id)) {
    ids.push(id);
    writeIds(key, ids);
  }
}

function removeId(key: string, id: string) {
  const ids = readIds(key).filter((v) => v !== id);
  writeIds(key, ids);
}

export const addMyQuestion = (id: string) => addId(QUESTIONS_KEY, id);
export const removeMyQuestion = (id: string) => removeId(QUESTIONS_KEY, id);
export const isMyQuestion = (id: string) => readIds(QUESTIONS_KEY).includes(id);

export const addMyComment = (id: string) => addId(COMMENTS_KEY, id);
export const removeMyComment = (id: string) => removeId(COMMENTS_KEY, id);
export const isMyComment = (id: string) => readIds(COMMENTS_KEY).includes(id);
