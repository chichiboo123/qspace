/**
 * Question Space – Google Apps Script 백엔드
 * ------------------------------------------------------------
 * 이 스크립트를 Google Apps Script 웹앱으로 배포하면
 * 내 구글 스프레드시트가 질문/답변 데이터 저장소가 됩니다.
 *
 * 설정 방법은 backend/README.md 를 참고하세요.
 *
 * ── 다국어 번역 ─────────────────────────────────────────────
 *   - 질문/답변을 만들거나 수정하면 서버가 본문을 한국어/영어/일본어/
 *     인도네시아어로 번역해 text_ko / text_en / text_ja / text_id 컬럼에
 *     저장합니다. 프론트의 "번역 모드"가 이 값을 사용합니다.
 *
 * ── 권한(삭제/수정) 검증 ─────────────────────────────────────
 *   - 생성 시 서버가 비밀 ownerToken 을 발급해 응답으로 1회 돌려줍니다.
 *     클라이언트는 보관했다가 수정/삭제 시 함께 보냅니다.
 *   - 서버는 (1) 본인 ownerToken 일치 또는 (2) 관리자 비밀번호가 맞을 때만
 *     수정/삭제를 허용합니다. ownerToken 은 조회 응답에 포함되지 않습니다.
 *   - 관리자 비밀번호는 코드가 아니라 스크립트 속성(ADMIN_PASSWORD)에 저장합니다.
 *
 * 시트 컬럼(헤더 이름 기준으로 동작하므로 순서가 달라도 됩니다)
 *   Questions: id, author, text, topics, createdAt,
 *              text_ko, text_en, text_ja, text_id, ownerToken
 *   Comments:  id, questionId, author, text, createdAt,
 *              text_ko, text_en, text_ja, text_id, ownerToken
 */

var QUESTIONS_SHEET = "Questions";
var COMMENTS_SHEET = "Comments";

var QUESTION_HEADERS = [
  "id", "author", "text", "topics", "createdAt",
  "text_ko", "text_en", "text_ja", "text_id", "ownerToken",
];
var COMMENT_HEADERS = [
  "id", "questionId", "author", "text", "createdAt",
  "text_ko", "text_en", "text_ja", "text_id", "ownerToken",
];

// 조회 응답에 포함할 다국어 필드 (ownerToken 은 절대 제외)
var LANG_FIELDS = ["text_ko", "text_en", "text_ja", "text_id"];
var LANG_TARGETS = { text_ko: "ko", text_en: "en", text_ja: "ja", text_id: "id" };

var ADMIN_PASSWORD_PROP = "ADMIN_PASSWORD";

/* ----------------------------- 진입점 ----------------------------- */

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || "";

    switch (action) {
      case "getall":
        return json(getAllQuestions());
      case "get":
        return json(getQuestionById(params.id) || { error: "not_found" });
      case "random":
        return json(getRandomQuestion());
      case "bytopic":
        return json(getQuestionsByTopic(params.topic));
      default:
        return json({ error: "unknown_action", action: action });
    }
  } catch (err) {
    return json({ error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || "";

    switch (action) {
      case "addquestion":
        return json(addQuestion(body.author, body.text, body.topics));
      case "addcomment":
        return json(addComment(body.questionId, body.author, body.text));
      case "verifyadmin":
        return json({ ok: isAdmin(body.password) });
      case "deletequestion":
        return json(deleteQuestion(body.id, body));
      case "updatequestion":
        return json(updateQuestion(body.id, body.text, body.topics, body));
      case "deletecomment":
        return json(deleteComment(body.questionId, body.id, body));
      case "updatecomment":
        return json(updateComment(body.questionId, body.id, body.text, body));
      default:
        return json({ error: "unknown_action", action: action });
    }
  } catch (err) {
    return json({ error: String(err) });
  }
}

/* --------------------------- 번역 --------------------------- */

/** 본문을 ko/en/ja/id 로 번역해 {text_ko, text_en, text_ja, text_id} 반환 */
function translateAll(text) {
  var src = String(text || "");
  var out = {};
  LANG_FIELDS.forEach(function (field) {
    if (!src.trim()) {
      out[field] = "";
      return;
    }
    try {
      out[field] = LanguageApp.translate(src, "", LANG_TARGETS[field]);
    } catch (e) {
      out[field] = ""; // 번역 실패 시 빈 값 (프론트는 원문으로 대체)
    }
  });
  return out;
}

/* --------------------------- 권한 검증 --------------------------- */

function getAdminPassword() {
  return PropertiesService.getScriptProperties().getProperty(ADMIN_PASSWORD_PROP) || "";
}

function isAdmin(password) {
  var stored = getAdminPassword();
  return !!stored && String(password) === stored;
}

function isAuthorized(storedToken, body) {
  if (body && body.adminPassword && isAdmin(body.adminPassword)) return true;
  var token = body && body.token ? String(body.token) : "";
  return !!storedToken && token === String(storedToken);
}

/* --------------------------- 시트 유틸 (헤더 이름 기준) --------------------------- */

function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    return sheet;
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }
  // 기존 시트에 빠진 컬럼이 있으면 오른쪽에 추가 (데이터 보존)
  var lastCol = sheet.getLastColumn();
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var toAdd = [];
  headers.forEach(function (h) {
    if (existing.indexOf(h) === -1) toAdd.push(h);
  });
  if (toAdd.length) {
    sheet.getRange(1, lastCol + 1, 1, toAdd.length).setValues([toAdd]);
  }
  return sheet;
}

/** 헤더 이름 → 1-indexed 컬럼 번호 */
function getHeaderMap(sheet) {
  var lastCol = sheet.getLastColumn();
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var map = {};
  row.forEach(function (h, i) {
    if (h) map[h] = i + 1;
  });
  return map;
}

/** 행을 헤더 이름으로 매핑한 객체 배열로 읽기 (_row = 실제 행 번호) */
function readRowsWithIndex(name, headers) {
  var sheet = getSheet(name, headers);
  var map = getHeaderMap(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function (row, idx) {
    var obj = { _row: idx + 2 };
    Object.keys(map).forEach(function (h) {
      obj[h] = row[map[h] - 1];
    });
    return obj;
  });
}

/** 객체를 시트의 실제 헤더 순서에 맞춰 한 행 추가 */
function appendByMap(sheet, dataObj) {
  var map = getHeaderMap(sheet);
  var lastCol = sheet.getLastColumn();
  var row = [];
  for (var i = 0; i < lastCol; i++) row.push("");
  Object.keys(dataObj).forEach(function (h) {
    if (map[h]) row[map[h] - 1] = dataObj[h];
  });
  sheet.appendRow(row);
}

/** 특정 행의 여러 컬럼을 헤더 이름으로 수정 */
function updateRowByMap(sheet, rowNumber, dataObj) {
  var map = getHeaderMap(sheet);
  Object.keys(dataObj).forEach(function (h) {
    if (map[h]) sheet.getRange(rowNumber, map[h]).setValue(dataObj[h]);
  });
}

function genId() {
  return Utilities.getUuid();
}

function genToken() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function topicsToString(topics) {
  if (Array.isArray(topics)) return topics.join(",");
  return String(topics || "");
}

function topicsToArray(value) {
  if (value === null || value === undefined) return [];
  return String(value)
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
}

function langFieldsFromRow(row) {
  var out = {};
  LANG_FIELDS.forEach(function (f) {
    out[f] = row[f] !== undefined && row[f] !== null ? String(row[f]) : "";
  });
  return out;
}

/* --------------------------- 조회 로직 --------------------------- */
/* 주의: 조회 응답에는 ownerToken 을 절대 포함하지 않습니다. */

function getAllQuestions() {
  var questions = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var comments = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);

  var byQuestion = {};
  comments.forEach(function (c) {
    var qid = String(c.questionId);
    if (!byQuestion[qid]) byQuestion[qid] = [];
    var comment = {
      id: String(c.id),
      questionId: qid,
      author: String(c.author),
      text: String(c.text),
      createdAt: String(c.createdAt),
    };
    var cLang = langFieldsFromRow(c);
    Object.keys(cLang).forEach(function (k) { comment[k] = cLang[k]; });
    byQuestion[qid].push(comment);
  });

  return questions.map(function (q) {
    var qid = String(q.id);
    var question = {
      id: qid,
      author: String(q.author),
      text: String(q.text),
      topics: topicsToArray(q.topics),
      createdAt: String(q.createdAt),
      comments: byQuestion[qid] || [],
    };
    var qLang = langFieldsFromRow(q);
    Object.keys(qLang).forEach(function (k) { question[k] = qLang[k]; });
    return question;
  });
}

function getQuestionById(id) {
  if (!id) return null;
  var all = getAllQuestions();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === String(id)) return all[i];
  }
  return null;
}

function getRandomQuestion() {
  var all = getAllQuestions();
  if (all.length === 0) return null;
  var idx = Math.floor(Math.random() * all.length);
  return all[idx];
}

function getQuestionsByTopic(topic) {
  if (!topic) return [];
  var all = getAllQuestions();
  return all.filter(function (q) {
    return q.topics.indexOf(String(topic)) !== -1;
  });
}

/* --------------------------- 생성 (번역 + 토큰 발급) --------------------------- */

function addQuestion(author, text, topics) {
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var id = genId();
  var token = genToken();
  var createdAt = nowIso();
  var tr = translateAll(text);

  appendByMap(sheet, {
    id: id,
    author: String(author || ""),
    text: String(text || ""),
    topics: topicsToString(topics),
    createdAt: createdAt,
    text_ko: tr.text_ko,
    text_en: tr.text_en,
    text_ja: tr.text_ja,
    text_id: tr.text_id,
    ownerToken: token,
  });

  return {
    id: id,
    author: String(author || ""),
    text: String(text || ""),
    topics: topicsToArray(topicsToString(topics)),
    createdAt: createdAt,
    comments: [],
    text_ko: tr.text_ko,
    text_en: tr.text_en,
    text_ja: tr.text_ja,
    text_id: tr.text_id,
    ownerToken: token, // 생성 응답에서만 1회 반환
  };
}

function addComment(questionId, author, text) {
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var id = genId();
  var token = genToken();
  var createdAt = nowIso();
  var tr = translateAll(text);

  appendByMap(sheet, {
    id: id,
    questionId: String(questionId || ""),
    author: String(author || ""),
    text: String(text || ""),
    createdAt: createdAt,
    text_ko: tr.text_ko,
    text_en: tr.text_en,
    text_ja: tr.text_ja,
    text_id: tr.text_id,
    ownerToken: token,
  });

  return {
    id: id,
    questionId: String(questionId || ""),
    author: String(author || ""),
    text: String(text || ""),
    createdAt: createdAt,
    text_ko: tr.text_ko,
    text_en: tr.text_en,
    text_ja: tr.text_ja,
    text_id: tr.text_id,
    ownerToken: token, // 생성 응답에서만 1회 반환
  };
}

/* --------------------------- 수정/삭제 (권한 검증) --------------------------- */

function deleteQuestion(id, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var rows = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var target = rows.filter(function (r) { return String(r.id) === String(id); });
  if (target.length === 0) return { error: "not_found" };
  if (!isAuthorized(target[0].ownerToken, body)) return { error: "unauthorized" };

  target
    .sort(function (a, b) { return b._row - a._row; })
    .forEach(function (r) { sheet.deleteRow(r._row); });

  // 해당 질문의 답변도 함께 삭제
  var cSheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var cRows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  cRows
    .filter(function (c) { return String(c.questionId) === String(id); })
    .sort(function (a, b) { return b._row - a._row; })
    .forEach(function (c) { cSheet.deleteRow(c._row); });

  return { ok: true, id: String(id) };
}

function updateQuestion(id, text, topics, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var rows = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var found = null;
  rows.forEach(function (r) { if (String(r.id) === String(id)) found = r; });
  if (!found) return { error: "not_found" };
  if (!isAuthorized(found.ownerToken, body)) return { error: "unauthorized" };

  var tr = translateAll(text);
  updateRowByMap(sheet, found._row, {
    text: String(text || ""),
    topics: topicsToString(topics),
    text_ko: tr.text_ko,
    text_en: tr.text_en,
    text_ja: tr.text_ja,
    text_id: tr.text_id,
  });
  return { ok: true, id: String(id) };
}

function deleteComment(questionId, id, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var rows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  var target = rows.filter(function (c) { return String(c.id) === String(id); });
  if (target.length === 0) return { error: "not_found" };
  if (!isAuthorized(target[0].ownerToken, body)) return { error: "unauthorized" };

  target
    .sort(function (a, b) { return b._row - a._row; })
    .forEach(function (c) { sheet.deleteRow(c._row); });
  return { ok: true, id: String(id) };
}

function updateComment(questionId, id, text, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var rows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  var found = null;
  rows.forEach(function (c) { if (String(c.id) === String(id)) found = c; });
  if (!found) return { error: "not_found" };
  if (!isAuthorized(found.ownerToken, body)) return { error: "unauthorized" };

  var tr = translateAll(text);
  updateRowByMap(sheet, found._row, {
    text: String(text || ""),
    text_ko: tr.text_ko,
    text_en: tr.text_en,
    text_ja: tr.text_ja,
    text_id: tr.text_id,
  });
  return { ok: true, id: String(id) };
}

/* --------------------------- 응답 헬퍼 --------------------------- */

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
