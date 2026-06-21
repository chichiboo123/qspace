export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Question {
  id: string;
  author: string;
  text: string;
  topics: string[];
  createdAt: string;
  comments: Comment[];
}

export const TOPICS = [
  { value: "imagination", label: "💭 상상", emoji: "💭" },
  { value: "people", label: "👫 사람", emoji: "👫" },
  { value: "dream", label: "🌙 꿈", emoji: "🌙" },
  { value: "history", label: "📜 역사", emoji: "📜" },
  { value: "science", label: "🔬 과학·기술", emoji: "🔬" },
  { value: "nature", label: "🌿 자연", emoji: "🌿" },
  { value: "emotion", label: "💗 마음·감정", emoji: "💗" },
  { value: "art", label: "🎨 예술", emoji: "🎨" },
  { value: "school", label: "🏫 학교", emoji: "🏫" },
  { value: "worry", label: "😔 고민", emoji: "😔" },
  { value: "etc", label: "✨ 기타", emoji: "✨" },
];

const STORAGE_KEY = "question-space-data";

function loadQuestions(): Question[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // migrate old single-topic format
    return parsed.map((q: any) => ({
      ...q,
      topics: q.topics || (q.topic ? [q.topic] : ["etc"]),
    }));
  } catch {
    return [];
  }
}

function saveQuestions(questions: Question[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function getQuestions(): Question[] {
  return loadQuestions();
}

export function getQuestionById(id: string): Question | undefined {
  return loadQuestions().find((q) => q.id === id);
}

export function getQuestionsByTopic(topic: string): Question[] {
  return loadQuestions().filter((q) => q.topics.includes(topic));
}

export function getRandomQuestion(): Question | undefined {
  const questions = loadQuestions();
  if (questions.length === 0) return undefined;
  return questions[Math.floor(Math.random() * questions.length)];
}

export function addQuestion(author: string, text: string, topics: string[]): Question {
  const questions = loadQuestions();
  const newQ: Question = {
    id: crypto.randomUUID(),
    author,
    text,
    topics,
    createdAt: new Date().toISOString(),
    comments: [],
  };
  questions.unshift(newQ);
  saveQuestions(questions);
  return newQ;
}

export function addComment(questionId: string, author: string, text: string): Comment | null {
  const questions = loadQuestions();
  const q = questions.find((q) => q.id === questionId);
  if (!q) return null;
  const comment: Comment = {
    id: crypto.randomUUID(),
    author,
    text,
    createdAt: new Date().toISOString(),
  };
  q.comments.push(comment);
  saveQuestions(questions);
  return comment;
}

export function deleteQuestion(id: string) {
  const questions = loadQuestions().filter((q) => q.id !== id);
  saveQuestions(questions);
}

export function updateQuestion(id: string, text: string, topics: string[]) {
  const questions = loadQuestions();
  const q = questions.find((q) => q.id === id);
  if (q) {
    q.text = text;
    q.topics = topics;
    saveQuestions(questions);
  }
}

export function getTopicLabel(value: string): string {
  const found = TOPICS.find((t) => t.value === value);
  if (found) return found.label;
  return `✨ ${value}`;
}
