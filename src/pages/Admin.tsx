import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Pencil, Check, X } from "lucide-react";
import StarField from "@/components/StarField";
import { TOPICS } from "@/lib/questions";
import { apiGetAllQuestions, apiDeleteQuestion, apiUpdateQuestion, Question } from "@/lib/api";
import { useLang, getTopicLabelI18n } from "@/lib/i18n";
import { toast } from "sonner";

const ADMIN_PASSWORD = "nsn2865";

export default function Admin() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuestions = () => {
    setLoading(true);
    apiGetAllQuestions().then(data => {
      setQuestions(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (authenticated) loadQuestions();
  }, [authenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      toast.success(t("adminLoginSuccess"));
    } else {
      toast.error(t("adminLoginFail"));
    }
  };

  const handleDelete = async (id: string) => {
    await apiDeleteQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success(t("adminDeleted"));
  };

  const handleEdit = (id: string, text: string, topics: string[]) => {
    setEditingId(id);
    setEditText(text);
    setEditTopics([...topics]);
  };

  const toggleEditTopic = (value: string) => {
    setEditTopics((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (editingId && editText.trim() && editTopics.length > 0) {
      await apiUpdateQuestion(editingId, editText.trim(), editTopics);
      setEditingId(null);
      loadQuestions();
      toast.success(t("adminSaved"));
    }
  };

  if (!authenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur border border-border rounded-2xl p-8 max-w-sm w-full text-center"
          >
            <h1 className="text-2xl text-secondary mb-2">{t("adminTitle")}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t("adminPasswordPrompt")}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder={t("adminPasswordPlaceholder")}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground mb-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-lg hover:brightness-110 transition-all"
            >
              {t("adminEnter")}
            </button>
            <button
              onClick={() => navigate("/")}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {t("home")}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarField />
      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} /> {t("home")}
          </button>
          <span className="text-sm text-secondary">{t("adminMode")}</span>
        </div>

        <h1 className="text-3xl text-center mb-6">
          <span className="text-secondary">{t("adminManageTitle1")}</span> {t("adminManageTitle2")}
        </h1>

        <p className="text-center text-muted-foreground mb-6">
          {t("adminTotal")} {questions.length}{t("adminQuestionUnit")}
        </p>

        {loading ? (
          <p className="text-center text-muted-foreground mt-16">Loading...</p>
        ) : questions.length === 0 ? (
          <p className="text-center text-muted-foreground mt-16">{t("adminNoQuestions")}</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card/70 backdrop-blur border border-border rounded-xl p-4"
              >
                {editingId === q.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary"
                      rows={2}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {TOPICS.map((tp) => (
                        <button
                          key={tp.value}
                          onClick={() => toggleEditTopic(tp.value)}
                          className={`px-2 py-1 rounded-full text-xs ${
                            editTopics.includes(tp.value)
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {getTopicLabelI18n(tp.value, lang)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleSave} className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm line-clamp-2">{q.text}</p>
                      <div className="flex gap-2 mt-1 flex-wrap items-center">
                        <span className="text-xs text-muted-foreground">{q.author}</span>
                        {q.topics.map((tp) => (
                          <span key={tp} className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                            {getTopicLabelI18n(tp, lang)}
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground">💬 {q.comments?.length || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(q.id, q.text, q.topics)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
