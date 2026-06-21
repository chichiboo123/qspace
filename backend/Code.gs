/**
 * Question Space – Google Apps Script 백엔드
 * ------------------------------------------------------------
 * 이 스크립트를 Google Apps Script 웹앱으로 배포하면
 * 내 구글 스프레드시트가 질문/답변 데이터 저장소가 됩니다.
 *
 * 설정 방법은 backend/README.md 를 참고하세요.
 *
 * 지원 액션
 *   GET  ?action=getall              모든 질문(+답변) 조회
 *   GET  ?action=get&id=...          단일 질문 조회
 *   GET  ?action=random              무작위 질문 1개
 *   GET  ?action=bytopic&topic=...   카테고리별 질문 조회
 *   POST {action:"addquestion", author, text, topics}
 *   POST {action:"addcomment", questionId, author, text}
 *   POST {action:"deletequestion", id}
 *   POST {action:"updatequestion", id, text, topics}
 *   POST {action:"deletecomment", questionId, id}
 *   POST {action:"updatecomment", questionId, id, text}
 */

var QUESTIONS_SHEET = "Questions";
var COMMENTS_SHEET = "Comments";

var QUESTION_HEADERS = ["id", "author", "text", "topics", "createdAt"];
var COMMENT_HEADERS = ["id", "questionId", "author", "text", "createdAt"];

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
      case "deletequestion":
        return json(deleteQuestion(body.id));
      case "updatequestion":
        return json(updateQuestion(body.id, body.text, body.topics));
      case "deletecomment":
        return json(deleteComment(body.questionId, body.id));
      case "updatecomment":
        return json(updateComment(body.questionId, body.id, body.text));
      default:
        return json({ error: "unknown_action", action: action });
    }
  } catch (err) {
    return json({ error: String(err) });
  }
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

function readRows(name, headers) {
  var sheet = getSheet(name, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) {
      obj[h] = row[i];
    });
    obj._row = null; // placeholder, set below
    return obj;
  });
}

/** 행 번호까지 포함해 읽기 (수정/삭제용) */
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

/* --------------------------- 생성/수정/삭제 --------------------------- */

function addQuestion(author, text, topics) {
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var id = genId();
  var createdAt = nowIso();
  sheet.appendRow([id, String(author || ""), String(text || ""), topicsToString(topics), createdAt]);
  return {
    id: id,
    author: String(author || ""),
    text: String(text || ""),
    topics: topicsToArray(topicsToString(topics)),
    createdAt: createdAt,
    comments: [],
  };
}

function addComment(questionId, author, text) {
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var id = genId();
  var createdAt = nowIso();
  sheet.appendRow([id, String(questionId || ""), String(author || ""), String(text || ""), createdAt]);
  return {
    id: id,
    questionId: String(questionId || ""),
    author: String(author || ""),
    text: String(text || ""),
    createdAt: createdAt,
  };
}

function deleteQuestion(id) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var rows = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var target = rows.filter(function (r) {
    return String(r.id) === String(id);
  });
  // 뒤에서부터 삭제 (행 번호 밀림 방지)
  target
    .sort(function (a, b) {
      return b._row - a._row;
    })
    .forEach(function (r) {
      sheet.deleteRow(r._row);
    });

  // 해당 질문의 답변도 삭제
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

function updateQuestion(id, text, topics) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(QUESTIONS_SHEET, QUESTION_HEADERS);
  var rows = readRowsWithIndex(QUESTIONS_SHEET, QUESTION_HEADERS);
  var found = false;
  rows.forEach(function (r) {
    if (String(r.id) === String(id)) {
      found = true;
      sheet.getRange(r._row, 3).setValue(String(text || "")); // text
      sheet.getRange(r._row, 4).setValue(topicsToString(topics)); // topics
    }
  });
  return found ? { ok: true, id: String(id) } : { error: "not_found" };
}

function deleteComment(questionId, id) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var rows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  rows
    .filter(function (c) {
      return String(c.id) === String(id);
    })
    .sort(function (a, b) {
      return b._row - a._row;
    })
    .forEach(function (c) {
      sheet.deleteRow(c._row);
    });
  return { ok: true, id: String(id) };
}

function updateComment(questionId, id, text) {
  if (!id) return { error: "missing_id" };
  var sheet = getSheet(COMMENTS_SHEET, COMMENT_HEADERS);
  var rows = readRowsWithIndex(COMMENTS_SHEET, COMMENT_HEADERS);
  var found = false;
  rows.forEach(function (c) {
    if (String(c.id) === String(id)) {
      found = true;
      sheet.getRange(c._row, 4).setValue(String(text || "")); // text
    }
  });
  return found ? { ok: true, id: String(id) } : { error: "not_found" };
}

/* --------------------------- 응답 헬퍼 --------------------------- */

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
