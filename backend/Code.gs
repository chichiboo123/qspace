/**
 * Question Space – Google Apps Script 백엔드
 * ------------------------------------------------------------
 * 이 스크립트를 Google Apps Script 웹앱으로 배포하면
 * 내 구글 스프레드시트가 질문/답변 데이터 저장소가 됩니다.
 *
 * 설정 방법은 backend/README.md 를 참고하세요.
 *
 * ── 권한(삭제/수정) 검증 ─────────────────────────────────────
 *   - 질문/답변을 만들 때 서버가 비밀 ownerToken 을 발급해 응답으로 돌려줍니다.
 *     클라이언트는 이 토큰을 보관했다가 수정/삭제 시 함께 보냅니다.
 *   - 서버는 (1) 본인 ownerToken 이 일치하거나 (2) 관리자 비밀번호가 맞을 때만
 *     수정/삭제를 허용합니다. ownerToken 은 조회(getall/get/...) 응답에는
 *     절대 포함되지 않습니다.
 *   - 관리자 비밀번호는 코드가 아니라 스크립트 속성(ADMIN_PASSWORD)에 저장합니다.
 *     Apps Script 편집기 → 프로젝트 설정(⚙️) → 스크립트 속성 에서 추가하세요.
 *
 * 지원 액션
 *   GET  ?action=getall              모든 질문(+답변) 조회
 *   GET  ?action=get&id=...          단일 질문 조회
 *   GET  ?action=random              무작위 질문 1개
 *   GET  ?action=bytopic&topic=...   카테고리별 질문 조회
 *   POST {action:"addquestion", author, text, topics}            → ownerToken 발급
 *   POST {action:"addcomment", questionId, author, text}         → ownerToken 발급
 *   POST {action:"verifyadmin", password}                        → 관리자 검증
 *   POST {action:"deletequestion", id, token?|adminPassword?}
 *   POST {action:"updatequestion", id, text, topics, token?|adminPassword?}
 *   POST {action:"deletecomment", questionId, id, token?|adminPassword?}
 *   POST {action:"updatecomment", questionId, id, text, token?|adminPassword?}
 */

var QUESTIONS_SHEET = "Questions";
var COMMENTS_SHEET = "Comments";

var QUESTION_HEADERS = ["id", "author", "text", "topics", "createdAt", "ownerToken"];
var COMMENT_HEADERS = ["id", "questionId", "author", "text", "createdAt", "ownerToken"];

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

/* --------------------------- 권한 검증 --------------------------- */

function getAdminPassword() {
  return PropertiesService.getScriptProperties().getProperty(ADMIN_PASSWORD_PROP) || "";
}

/** 관리자 비밀번호 일치 여부 (빈 비밀번호로는 통과 불가) */
function isAdmin(password) {
  var stored = getAdminPassword();
  return !!stored && String(password) === stored;
}

/**
 * 수정/삭제 권한 검증.
 * storedToken 이 비어 있지 않고 요청 token 과 일치하거나,
 * 관리자 비밀번호가 맞으면 true.
 */
function isAuthorized(storedToken, body) {
  if (body && body.adminPassword && isAdmin(body.adminPassword)) return true;
  var token = body && body.token ? String(body.token) : "";
  return !!storedToken && token === String(storedToken);
}

/* --------------------------- 시트 유틸 --------------------------- */

function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

/** 행 번호까지 포함해 읽기 (조회/수정/삭제용) */
function readRowsWithIndex(name, headers) {
  var sheet = getSheet(name, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row, idx) {
    var obj = {};
    headers.forEach(function (h, i) {
      obj[h] = row[i];
    });
    obj._row = idx + 2; // 실제 시트 행 번호
    return obj;
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
    .map(function (s) {
      return s.trim();
    })
    .filter(function (s) {
      return s.length > 0;
    });
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
    byQuestion[qid].push({
      id: String(c.id),
      questionId: qid,
      author: String(c.author),
      text: String(c.text),
      createdAt: String(c.createdAt),
    });
  });

  return questions.map(function (q) {
    var qid = String(q.id);
    return {
      id: qid,
      author: String(q.author),
      text: String(q.text),
      topics: topicsToArray(q.topics),
      createdAt: String(q.createdAt),
      comments: byQuestion[qid] || [],
    };
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

/* --------------------------- 생성 (토큰 발급) --------------------------- */

function addQuestion(author, text, topics) {
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var id = genId();
  var token = genToken();
  var createdAt = nowIso();
  sheet.appendRow([
    id,
    String(author || ""),
    String(text || ""),
    topicsToString(topics),
    createdAt,
    token,
  ]);
  return {
    id: id,
    author: String(author || ""),
    text: String(text || ""),
    topics: topicsToArray(topicsToString(topics)),
    createdAt: createdAt,
    comments: [],
    ownerToken: token, // 생성 응답에서만 1회 반환
  };
}

function addComment(questionId, author, text) {
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var id = genId();
  var token = genToken();
  var createdAt = nowIso();
  sheet.appendRow([
    id,
    String(questionId || ""),
    String(author || ""),
    String(text || ""),
    createdAt,
    token,
  ]);
  return {
    id: id,
    questionId: String(questionId || ""),
    author: String(author || ""),
    text: String(text || ""),
    createdAt: createdAt,
    ownerToken: token, // 생성 응답에서만 1회 반환
  };
}

/* --------------------------- 수정/삭제 (권한 검증) --------------------------- */

function deleteQuestion(id, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var rows = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var target = rows.filter(function (r) {
    return String(r.id) === String(id);
  });
  if (target.length === 0) return { error: "not_found" };
  if (!isAuthorized(target[0].ownerToken, body)) return { error: "unauthorized" };

  // 질문 행 삭제 (뒤에서부터 삭제해 행 번호 밀림 방지)
  target
    .sort(function (a, b) {
      return b._row - a._row;
    })
    .forEach(function (r) {
      sheet.deleteRow(r._row);
    });

  // 해당 질문의 답변도 함께 삭제
  var cSheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var cRows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  cRows
    .filter(function (c) {
      return String(c.questionId) === String(id);
    })
    .sort(function (a, b) {
      return b._row - a._row;
    })
    .forEach(function (c) {
      cSheet.deleteRow(c._row);
    });

  return { ok: true, id: String(id) };
}

function updateQuestion(id, text, topics, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var rows = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var found = null;
  rows.forEach(function (r) {
    if (String(r.id) === String(id)) found = r;
  });
  if (!found) return { error: "not_found" };
  if (!isAuthorized(found.ownerToken, body)) return { error: "unauthorized" };

  sheet.getRange(found._row, 3).setValue(String(text || "")); // text (3열)
  sheet.getRange(found._row, 4).setValue(topicsToString(topics)); // topics (4열)
  return { ok: true, id: String(id) };
}

function deleteComment(questionId, id, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var rows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  var target = rows.filter(function (c) {
    return String(c.id) === String(id);
  });
  if (target.length === 0) return { error: "not_found" };
  if (!isAuthorized(target[0].ownerToken, body)) return { error: "unauthorized" };

  target
    .sort(function (a, b) {
      return b._row - a._row;
    })
    .forEach(function (c) {
      sheet.deleteRow(c._row);
    });
  return { ok: true, id: String(id) };
}

function updateComment(questionId, id, text, body) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var rows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  var found = null;
  rows.forEach(function (c) {
    if (String(c.id) === String(id)) found = c;
  });
  if (!found) return { error: "not_found" };
  if (!isAuthorized(found.ownerToken, body)) return { error: "unauthorized" };

  sheet.getRange(found._row, 4).setValue(String(text || "")); // text (4열)
  return { ok: true, id: String(id) };
}

/* --------------------------- 응답 헬퍼 --------------------------- */

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
