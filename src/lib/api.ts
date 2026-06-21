// 데이터 백엔드(Google Apps Script) 주소.
// .env 파일에 VITE_API_URL 을 설정하면 내 백엔드(내 구글 시트)로 연결됩니다.
// 자세한 설정 방법은 backend/README.md 를 참고하세요.
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "REPLACE_WITH_YOUR_APPS_SCRIPT_URL";

export interface Comment {
  id: string;
  questionId: string;
  author: string;
  text: string;
  createdAt: string;
  ownerToken?: string;
  text_ko?: string;
  text_en?: string;
  text_ja?: string;
  text_id?: string;
}

export interface Question {
  id: string;
  author: string;
  text: string;
  topics: string[];
  createdAt: string;
  comments: Comment[];
  ownerToken?: string;
  text_ko?: string;
  text_en?: string;
  text_ja?: string;
  text_id?: string;
}

// 수정/삭제 권한 증명: 본인 토큰 또는 관리자 비밀번호
export interface AuthArg {
  token?: string;
  adminPassword?: string;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeTopics(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => safeString(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function sanitizeComment(raw: any): Comment | null {
  const id = safeString(raw?.id).trim();
  if (!id) return null;

  return {
    id,
    questionId: safeString(raw?.questionId).trim(),
    author: safeString(raw?.author),
    text: safeString(raw?.text),
    createdAt: safeString(raw?.createdAt),
    ownerToken: safeString(raw?.ownerToken),
    text_ko: safeString(raw?.text_ko),
    text_en: safeString(raw?.text_en),
    text_ja: safeString(raw?.text_ja),
    text_id: safeString(raw?.text_id),
  };
}

function sanitizeQuestion(raw: any): Question | null {
  const id = safeString(raw?.id).trim();
  const text = safeString(raw?.text);
  if (!id || !text.trim()) return null;

  const rawComments = Array.isArray(raw?.comments) ? raw.comments : [];

  return {
    id,
    author: safeString(raw?.author),
    text,
    topics: normalizeTopics(raw?.topics),
    createdAt: safeString(raw?.createdAt),
    comments: rawComments.map(sanitizeComment).filter(Boolean) as Comment[],
    ownerToken: safeString(raw?.ownerToken),
    text_ko: safeString(raw?.text_ko),
    text_en: safeString(raw?.text_en),
    text_ja: safeString(raw?.text_ja),
    text_id: safeString(raw?.text_id),
  };
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${text.slice(0, 160)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid API response: ${text.slice(0, 160)}`);
  }
}

async function fetchGet(action: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  return fetchJson(url.toString(), {
    method: "GET",
    cache: "no-store",
  });
}

async function fetchPost(body: Record<string, any>): Promise<any> {
  return fetchJson(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
}

export async function apiGetAllQuestions(): Promise<Question[]> {
  const data = await fetchGet("getall");
  if (!Array.isArray(data)) return [];
  return data.map(sanitizeQuestion).filter(Boolean) as Question[];
}

export async function apiGetQuestionById(id: string): Promise<Question | null> {
  if (!id) return null;
  const data = await fetchGet("get", { id });
  if (data?.error) return null;
  return sanitizeQuestion(data);
}

export async function apiGetRandomQuestion(): Promise<Question | null> {
  const data = await fetchGet("random");
  if (!data) return null;
  return sanitizeQuestion(data);
}

export async function apiGetQuestionsByTopic(topic: string): Promise<Question[]> {
  const data = await fetchGet("bytopic", { topic });
  if (!Array.isArray(data)) return [];
  return data.map(sanitizeQuestion).filter(Boolean) as Question[];
}

export async function apiAddQuestion(author: string, text: string, topics: string[]): Promise<Question> {
  const data = await fetchPost({ action: "addquestion", author, text, topics });
  const sanitized = sanitizeQuestion(data);
  if (!sanitized) throw new Error("Invalid addquestion response");
  return sanitized;
}

export async function apiAddComment(questionId: string, author: string, text: string): Promise<Comment> {
  const data = await fetchPost({ action: "addcomment", questionId, author, text });
  const sanitized = sanitizeComment(data);
  if (!sanitized) throw new Error("Invalid addcomment response");
  return sanitized;
}

function withAuth(body: Record<string, any>, auth?: AuthArg): Record<string, any> {
  if (auth?.token) body.token = auth.token;
  if (auth?.adminPassword) body.adminPassword = auth.adminPassword;
  return body;
}

function assertAuthorized(data: any): any {
  if (data?.error === "unauthorized") {
    throw new Error("unauthorized");
  }
  return data;
}

export async function apiDeleteQuestion(id: string, auth?: AuthArg): Promise<any> {
  return assertAuthorized(await fetchPost(withAuth({ action: "deletequestion", id }, auth)));
}

export async function apiUpdateQuestion(id: string, text: string, topics: string[], auth?: AuthArg): Promise<any> {
  return assertAuthorized(await fetchPost(withAuth({ action: "updatequestion", id, text, topics }, auth)));
}

export async function apiDeleteComment(questionId: string, id: string, auth?: AuthArg): Promise<any> {
  return assertAuthorized(await fetchPost(withAuth({ action: "deletecomment", questionId, id }, auth)));
}

export async function apiUpdateComment(questionId: string, id: string, text: string, auth?: AuthArg): Promise<any> {
  return assertAuthorized(await fetchPost(withAuth({ action: "updatecomment", questionId, id, text }, auth)));
}

// 관리자 비밀번호를 서버에서 검증 (비밀번호는 번들에 저장하지 않음)
export async function apiVerifyAdmin(password: string): Promise<boolean> {
  try {
    const data = await fetchPost({ action: "verifyadmin", password });
    return data?.ok === true;
  } catch {
    return false;
  }
}
