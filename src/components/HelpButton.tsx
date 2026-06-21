import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useLang, Lang } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

const helpContent: Record<Lang, { title: string; steps: string[]; dev: string }> = {
  ko: {
    title: "🛰️ 질문 스페이스 사용법",
    steps: [
      "1️⃣ 홈 화면에서 이름(닉네임)과 궁금한 질문을 적어요",
      "2️⃣ 질문의 주제(카테고리)를 하나 이상 골라요",
      "3️⃣ '질문 발사!' 버튼을 눌러 질문을 우주로 보내요 🚀",
      "4️⃣ '질문 탐험'에서 다른 친구들의 질문을 구경해요",
      "5️⃣ 질문을 클릭하면 답변을 달 수 있어요 ⭐",
      "6️⃣ '랜덤 질문'으로 깜짝 질문을 만나보세요 🎲",
      "7️⃣ 🌐 버튼으로 한국어·영어·일본어를 전환할 수 있어요",
    ],
    dev: "🎭 개발: 교육뮤지컬 꿈꾸는 치수쌤",
  },
  en: {
    title: "🛰️ How to Use Question Space",
    steps: [
      "1️⃣ Enter your name (nickname) and write your question",
      "2️⃣ Choose one or more topic categories",
      "3️⃣ Press 'Launch!' to send your question to space 🚀",
      "4️⃣ Explore other friends' questions in 'Explore'",
      "5️⃣ Click a question to leave an answer ⭐",
      "6️⃣ Try 'Random' for a surprise question 🎲",
      "7️⃣ Use 🌐 button to switch between KOR·ENG·JPN",
    ],
    dev: "🎭 Created by. 교육뮤지컬 꿈꾸는 치수쌤",
  },
  ja: {
    title: "🛰️ 質問スペースの使い方",
    steps: [
      "1️⃣ ホーム画面で名前（ニックネーム）と質問を書こう",
      "2️⃣ 質問のテーマ（カテゴリ）を1つ以上選ぼう",
      "3️⃣ 「質問発射！」ボタンで質問を宇宙に送ろう 🚀",
      "4️⃣ 「探検」で他の友達の質問を見てみよう",
      "5️⃣ 質問をクリックして回答を書こう ⭐",
      "6️⃣ 「ランダム」でサプライズ質問に出会おう 🎲",
      "7️⃣ 🌐ボタンで韓国語·英語·日本語を切り替えられるよ",
    ],
    dev: "🎭 開発: 教育ミュージカル 夢見るチスせんせい",
  },
};

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();
  const content = helpContent[lang];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 bg-card/80 backdrop-blur border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all"
      >
        <HelpCircle size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-card border border-border rounded-2xl p-6 z-50 max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-primary mb-4">{content.title}</h2>

              <div className="space-y-2.5 mb-6">
                {content.steps.map((step, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed">{step}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-accent font-medium text-center">{content.dev}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
