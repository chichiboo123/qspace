import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Compass, Shuffle, Settings } from "lucide-react";
import StarField from "@/components/StarField";
import SatelliteIcon from "@/components/SatelliteIcon";
import LangSwitcher from "@/components/LangSwitcher";
import HelpButton from "@/components/HelpButton";
import { TOPICS } from "@/lib/questions";
import { apiGetAllQuestions, apiAddQuestion, Question } from "@/lib/api";
import { addMyQuestion } from "@/lib/ownership";
import { useLang, getTopicLabelI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function Index() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [launching, setLaunching] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    apiGetAllQuestions().then(data => {
      setQuestions(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleTopic = (value: string) => {
    setSelectedTopics((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
    if (value === "etc" && selectedTopics.includes("etc")) {
      setCustomTopic("");
    }
  };

  const handleLaunch = async () => {
    if (!author.trim()) { toast.error(t("toastName")); return; }
    if (!text.trim()) { toast.error(t("toastQuestion")); return; }
    if (!/[?？]$/.test(text.trim())) { toast.error(t("toastQuestionMark")); return; }
    if (text.trim().length > 300) { toast.error(t("toastLength")); return; }
    if (selectedTopics.length === 0) { toast.error(t("toastTopic")); return; }
    if (selectedTopics.includes("etc") && !customTopic.trim()) {
      toast.error(t("toastEtc"));
      return;
    }

    const finalTopics = selectedTopics.map((tp) =>
      tp === "etc" ? customTopic.trim() : tp
    );

    setLaunching(true);
    try {
      const newQ = await apiAddQuestion(author.trim(), text.trim(), finalTopics);
      addMyQuestion(newQ.id);
      setQuestions(prev => [newQ, ...prev]);
      setText("");
      setSelectedTopics([]);
      setCustomTopic("");
      toast.success(t("toastSuccess"));
    } catch {
      toast.error("Failed to launch question");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center px-4 pt-14 pb-8 min-h-screen">
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <LangSwitcher />
          <HelpButton />
        </div>

        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6 mt-2"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl tracking-wide mb-2">
            <span className="text-primary">{t("title1")}</span>{" "}
            <span className="text-accent">{t("title2")}</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-8 flex-wrap justify-center"
        >
          <button
            onClick={() => navigate("/questions")}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-primary transition-colors text-foreground text-base"
          >
            <Compass size={18} className="text-primary" />
            {t("exploreBtn")}
          </button>
          <button
            onClick={() => navigate("/random")}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-accent transition-colors text-foreground text-base"
          >
            <Shuffle size={18} className="text-accent" />
            {t("randomBtn")}
          </button>
        </motion.div>

        {/* Digital counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="bg-card/80 backdrop-blur border border-border rounded-xl px-8 py-4">
            {loading ? (
              <span className="text-2xl text-muted-foreground">...</span>
            ) : (
              <motion.span
                key={questions.length}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-5xl md:text-6xl font-black tracking-widest block text-center"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  color: `hsl(${(questions.length * 137) % 360}, 80%, 60%)`,
                  filter: `drop-shadow(0 0 16px hsl(${(questions.length * 137) % 360}, 80%, 50%))`,
                }}
              >
                {String(questions.length).padStart(3, "0")}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Question Input Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-lg bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 mb-10"
        >
          <h2 className="text-xl text-primary mb-4 text-center">{t("createTitle")}</h2>

          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground mb-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("questionPlaceholder")}
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground mb-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <p className="text-sm text-muted-foreground mb-2">{t("topicGuide")}</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {TOPICS.map((tp) => (
              <button
                key={tp.value}
                onClick={() => toggleTopic(tp.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedTopics.includes(tp.value)
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {getTopicLabelI18n(tp.value, lang)}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedTopics.includes("etc") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/50 rounded-xl p-3 mb-2 border border-border">
                  <p className="text-sm text-accent mb-2">
                    {t("etcGuideTitle")}<br />
                    <span className="text-xs text-muted-foreground">{t("etcGuideDesc")}</span>
                  </p>
                  <input
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder={t("etcInputPlaceholder")}
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {launching && (
              <motion.div
                className="flex justify-center mb-3"
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -200, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <span className="text-5xl">🚀</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-4 rounded-xl text-primary-foreground text-xl tracking-wider hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--launch))", fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            <Rocket size={22} />
            {launching ? t("launching") : t("launchBtn")}
          </button>
        </motion.div>

        {/* Recent satellites */}
        {questions.length > 0 && (
          <div className="w-full max-w-3xl">
            <h2 className="text-lg text-muted-foreground mb-1 text-center">
              🛰️ {t("recentSatellites")} ({Math.min(visibleCount, questions.length)})
            </h2>
            <p className="text-xs text-accent mb-4 text-center">
              {t("recentSatellitesGuide")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {questions.slice(0, visibleCount).map((q, i) => {
                const displayText =
                  (lang === "en" && q.text_en) ? q.text_en :
                  (lang === "ja" && q.text_ja) ? q.text_ja :
                  (lang === "id" && q.text_id) ? q.text_id :
                  (lang === "ko" && q.text_ko) ? q.text_ko :
                  q.text;
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 9) * 0.08 }}
                    onClick={() => navigate(`/question/${q.id}`)}
                    className="bg-card/60 backdrop-blur border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-all hover:scale-105 flex flex-col items-center text-center gap-2"
                  >
                    <SatelliteIcon index={i} size={40} />
                    <p className="text-sm text-foreground line-clamp-2 break-words">{displayText}</p>
                    <span className="text-xs text-muted-foreground">{q.author}</span>
                  </motion.div>
                );
              })}
            </div>
            {visibleCount < questions.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + 9)}
                  className="px-6 py-2.5 rounded-full bg-card border border-border hover:border-primary text-muted-foreground hover:text-foreground text-sm transition-all"
                >
                  {t("loadMore")} ({questions.length - visibleCount})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 mb-4 text-center">
          <a
            href="https://litt.ly/chichiboo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            created by. 교육뮤지컬 꿈꾸는 치수쌤
          </a>
        </footer>

        <button
          onClick={() => navigate("/admin")}
          className="fixed bottom-4 right-4 p-2 rounded-full text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors z-20"
          title="Admin"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
