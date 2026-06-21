import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Pencil, Trash2, Check, X } from "lucide-react";
import StarField from "@/components/StarField";
import SatelliteIcon from "@/components/SatelliteIcon";
import { TOPICS } from "@/lib/questions";
import {
  apiGetQuestionById,
  apiAddComment,
  apiUpdateQuestion,
  apiDeleteQuestion,
  apiUpdateComment,
  apiDeleteComment,
  Question,
} from "@/lib/api";
import {
  addMyComment,
  isMyComment,
  isMyQuestion,
  removeMyComment,
  removeMyQuestion,
} from "@/lib/ownership";
import { useLang, getTopicLabelI18n, Lang } from "@/lib/i18n";
import { toast } from "sonner";

type DisplayLang = "original" | Lang;

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [translationLang, setTranslationLang] = useState<DisplayLang>("original");
  const [lastCommentTime, setLastCommentTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQText, setEditQText] = useState("");
  const [editQTopics, setEditQTopics] = useState<string[]>([]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    apiGetQuestionById(id || "").then(data => {
      setQuestion(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <p className="text-xl text-muted-foreground">{t("notFound")}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-full"
          >
            {t("goHome")}
          </button>
        </div>
      </div>
    );
  }

  const ownsQuestion = isMyQuestion(question.id);

  const handleComment = async () => {
    if (!commentAuthor.trim()) { toast.error(t("toastAnswerName")); return; }
    if (!commentText.trim()) { toast.error(t("toastAnswerText")); return; }
    if (commentText.trim().length > 500) { toast.error(t("toastAnswerLength")); return; }

    if (lastCommentTime && Date.now() - lastCommentTime < 20000) {
      toast.error(t("toastAnswerCooldown"));
      return;
    }

    const trimmedText = commentText.trim();
    const isDuplicate = question.comments?.some(
      (c) => c.text.trim() === trimmedText
    );
    if (isDuplicate) {
      toast.error(t("toastAnswerDuplicate"));
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      const newComment = await apiAddComment(question.id, commentAuthor.trim(), trimmedText);
      addMyComment(newComment.id);
      setQuestion(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
      setCommentText("");
      setLastCommentTime(Date.now());
      toast.success(t("toastAnswerSuccess"));
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditQuestion = () => {
    setEditQText(question.text);
    setEditQTopics([...question.topics]);
    setEditingQuestion(true);
  };

  const toggleEditQTopic = (value: string) => {
    setEditQTopics((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSaveQuestion = async () => {
    if (!editQText.trim()) { toast.error(t("toastQuestion")); return; }
    if (!/[?？]$/.test(editQText.trim())) { toast.error(t("toastQuestionMark")); return; }
    if (editQText.trim().length > 300) { toast.error(t("toastLength")); return; }
    if (editQTopics.length === 0) { toast.error(t("toastTopic")); return; }

    setSavingQuestion(true);
    try {
      await apiUpdateQuestion(question.id, editQText.trim(), editQTopics);
      const refreshed = await apiGetQuestionById(question.id);
      if (refreshed) setQuestion(refreshed);
      setEditingQuestion(false);
      setTranslationLang("original");
      toast.success(t("toastQuestionUpdated"));
    } catch {
      toast.error("Failed to update question");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm(t("confirmDeleteQuestion"))) return;
    try {
      await apiDeleteQuestion(question.id);
      removeMyQuestion(question.id);
      toast.success(t("toastQuestionDeleted"));
      navigate("/questions");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const startEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(text);
  };

  const handleSaveComment = async () => {
    if (!editingCommentId) return;
    const trimmed = editCommentText.trim();
    if (!trimmed) { toast.error(t("toastAnswerText")); return; }
    if (trimmed.length > 500) { toast.error(t("toastAnswerLength")); return; }

    setSavingComment(true);
    try {
      await apiUpdateComment(question.id, editingCommentId, trimmed);
      const refreshed = await apiGetQuestionById(question.id);
      if (refreshed) setQuestion(refreshed);
      setEditingCommentId(null);
      setTranslationLang("original");
      toast.success(t("toastCommentUpdated"));
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t("confirmDeleteComment"))) return;
    try {
      await apiDeleteComment(question.id, commentId);
      removeMyComment(commentId);
      setQuestion(prev =>
        prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : prev
      );
      toast.success(t("toastCommentDeleted"));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const getDisplayedQuestionText = () => {
    if (translationLang === "original") return question.text;
    if (translationLang === "ko" && question.text_ko) return question.text_ko;
    if (translationLang === "en" && question.text_en) return question.text_en;
    if (translationLang === "ja" && question.text_ja) return question.text_ja;
    if (translationLang === "id" && question.text_id) return question.text_id;
    return question.text;
  };

  const getDisplayedCommentText = (c: Question["comments"][number]) => {
    if (translationLang === "original") return c.text;
    if (translationLang === "ko" && c.text_ko) return c.text_ko;
    if (translationLang === "en" && c.text_en) return c.text_en;
    if (translationLang === "ja" && c.text_ja) return c.text_ja;
    if (translationLang === "id" && c.text_id) return c.text_id;
    return c.text;
  };

  const topicLang: Lang = translationLang === "original" ? lang : translationLang;
  const dateLang = lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : lang === "id" ? "id-ID" : "ko-KR";

  const langButtons: { value: DisplayLang; label: string }[] = [
    { value: "original", label: t("origLang") },
    { value: "ko", label: "KO" },
    { value: "en", label: "EN" },
    { value: "ja", label: "JP" },
    { value: "id", label: "ID" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarField />
      <div className="relative z-10 px-4 py-8 max-w-lg mx-auto">
        <button
          onClick={() => {
            if (window.history.length > 1) { navigate(-1); }
            else { navigate("/"); }
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} /> {t("back")}
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <SatelliteIcon size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex gap-1.5 flex-wrap items-center">
                {question.topics.map((tp) => (
                  <span key={tp} className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                    {getTopicLabelI18n(tp, topicLang)}
                  </span>
                ))}
                {ownsQuestion && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                    {t("myBadge")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {question.author} · {new Date(question.createdAt).toLocaleDateString(dateLang)}
              </p>
            </div>
            {ownsQuestion && !editingQuestion && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={startEditQuestion}
                  title={t("edit")}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={handleDeleteQuestion}
                  title={t("delete")}
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/15 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {editingQuestion ? (
            <div className="space-y-3">
              <textarea
                value={editQText}
                onChange={(e) => setEditQText(e.target.value)}
                rows={3}
                maxLength={300}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-1.5 flex-wrap">
                {TOPICS.map((tp) => (
                  <button
                    key={tp.value}
                    onClick={() => toggleEditQTopic(tp.value)}
                    className={`px-2 py-1 rounded-full text-xs transition-all ${
                      editQTopics.includes(tp.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {getTopicLabelI18n(tp.value, lang)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingQuestion(false)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm flex items-center gap-1 hover:bg-muted/80"
                >
                  <X size={14} /> {t("cancel")}
                </button>
                <button
                  onClick={handleSaveQuestion}
                  disabled={savingQuestion}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Check size={14} /> {t("save")}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xl text-foreground leading-relaxed whitespace-pre-wrap break-words">
              {getDisplayedQuestionText()}
            </p>
          )}

          {/* Translation buttons */}
          {!editingQuestion && (
            <div className="flex gap-1.5 mt-4 pt-3 border-t border-border flex-wrap items-center">
              <span className="text-xs text-muted-foreground mr-1">🌐</span>
              {langButtons.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setTranslationLang(b.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    translationLang === b.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Comments */}
        <div className="mb-4">
          <h2 className="text-lg text-primary mb-3">{t("answers")} ({question.comments?.length || 0})</h2>

          {(!question.comments || question.comments.length === 0) ? (
            <p className="text-muted-foreground text-center py-6">{t("noAnswers")}</p>
          ) : (
            <div className="space-y-3 mb-4">
              <AnimatePresence>
                {question.comments.map((c, i) => {
                  const ownsComment = isMyComment(c.id);
                  const isEditingThis = editingCommentId === c.id;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-muted/50 rounded-xl p-3 border border-border"
                    >
                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={2}
                            maxLength={500}
                            className="w-full px-2 py-1.5 rounded-lg bg-input border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={handleSaveComment}
                              disabled={savingComment}
                              className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <p className="text-foreground text-sm flex-1 whitespace-pre-wrap break-words">
                              {getDisplayedCommentText(c)}
                            </p>
                            {ownsComment && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => startEditComment(c.id, c.text)}
                                  title={t("edit")}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  title={t("delete")}
                                  className="p-1 rounded text-destructive hover:bg-destructive/15 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {c.author} · {new Date(c.createdAt).toLocaleDateString(dateLang)}
                            {ownsComment && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent ml-1">
                                {t("myBadge")}
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-4">
          <input
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            placeholder={t("answerNamePlaceholder")}
            maxLength={20}
            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 items-end">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("answerPlaceholder")}
              maxLength={500}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleComment}
              disabled={submitting}
              className="shrink-0 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1 text-right">
            {commentText.length}/500
          </p>
        </div>
      </div>
    </div>
  );
}
