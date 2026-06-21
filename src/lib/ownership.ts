// 내 질문/답변 식별 + 서버 권한 검증용 비밀 토큰 저장 (localStorage)
// 질문/답변을 만들 때 서버가 발급한 ownerToken 을 저장해 두고,
// 수정/삭제 시 서버에 함께 보내 본인임을 증명합니다.
const QUESTIONS_KEY = "qs-my-questions";
const COMMENTS_KEY = "qs-my-comments";

type TokenMap = Record<string, string>;

function readMap(key: string): TokenMap {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // 구버전(문자열 id 배열) 데이터 마이그레이션: 토큰 없이 id 만 보관
    if (Array.isArray(parsed)) {
      const map: TokenMap = {};
      parsed.forEach((v) => {
        if (typeof v === "string") map[v] = "";
      });
      return map;
    }
    if (parsed && typeof parsed === "object") {
      const map: TokenMap = {};
      Object.keys(parsed).forEach((k) => {
        const v = (parsed as Record<string, unknown>)[k];
        if (typeof v === "string") map[k] = v;
      });
      return map;
    }
    return {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: TokenMap) {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* storage unavailable, ignore */
  }
}

function addEntry(key: string, id: string, token?: string) {
  if (!id) return;
  const map = readMap(key);
  map[id] = token || "";
  writeMap(key, map);
}

function removeEntry(key: string, id: string) {
  const map = readMap(key);
  if (id in map) {
    delete map[id];
    writeMap(key, map);
  }
}

export const addMyQuestion = (id: string, token?: string) =>
  addEntry(QUESTIONS_KEY, id, token);
export const removeMyQuestion = (id: string) => removeEntry(QUESTIONS_KEY, id);
export const isMyQuestion = (id: string) => id in readMap(QUESTIONS_KEY);
export const getMyQuestionToken = (id: string) => readMap(QUESTIONS_KEY)[id] || "";

export const addMyComment = (id: string, token?: string) =>
  addEntry(COMMENTS_KEY, id, token);
export const removeMyComment = (id: string) => removeEntry(COMMENTS_KEY, id);
export const isMyComment = (id: string) => id in readMap(COMMENTS_KEY);
export const getMyCommentToken = (id: string) => readMap(COMMENTS_KEY)[id] || "";
