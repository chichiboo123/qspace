import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import StarField from "@/components/StarField";
import SatelliteIcon from "@/components/SatelliteIcon";
import { TOPICS } from "@/lib/questions";
import { apiGetAllQuestions, apiGetQuestionsByTopic, Question } from "@/lib/api";
import { isMyQuestion } from "@/lib/ownership";
import { useLang, getTopicLabelI18n } from "@/lib/i18n";

export default function Questions() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = selectedTopic
      ? apiGetQuestionsByTopic(selectedTopic)
      : apiGetAllQuestions();
    fetcher.then(data => {
      setQuestions(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedTopic]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarField />
      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} /> {t("home")}
        </button>

        <h1 className="text-3xl text-center mb-6">
          <span className="text-primary">{t("exploreTitle")}</span> {t("exploreTitleSuffix")}
        </h1>

        <div className="flex gap-2 flex-wrap justify-center mb-8">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              !selectedTopic
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("allFilter")}
          </button>
          {TOPICS.map((tp) => (
            <button
              key={tp.value}
              onClick={() => setSelectedTopic(tp.value)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedTopic === tp.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {getTopicLabelI18n(tp.value, lang)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground mt-16">Loading...</p>
        ) : questions.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg mt-16">
            {t("noQuestions")}<br />
            {t("noQuestionsSub")}
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/question/${q.id}`)}
                className="bg-card/70 backdrop-blur border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-all flex items-center gap-4"
              >
                <SatelliteIcon index={i} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground line-clamp-2 break-words">{q.text}</p>
                  <div className="flex gap-2 mt-1 flex-wrap items-center">
                    <span className="text-xs text-muted-foreground">{q.author}</span>
                    {isMyQuestion(q.id) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                        {t("myBadge")}
                      </span>
                    )}
                    {q.topics.map((tp) => (
                      <span key={tp} className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        {getTopicLabelI18n(tp, lang)}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground">💬 {q.comments?.length || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
