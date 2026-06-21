import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ko" | "en" | "ja" | "id";

export const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "ko", label: "KOR" },
  { value: "en", label: "ENG" },
  { value: "ja", label: "JPN" },
  { value: "id", label: "IDN" },
];

const translations = {
  // Index
  title1: { ko: "질문", en: "Question", ja: "質問", id: "Pertanyaan" },
  title2: { ko: "스페이스", en: "Space", ja: "スペース", id: "Ruang" },
  subtitle: { ko: "우리들의 질문으로 만드는 우주", en: "A universe made from our questions", ja: "私たちの質問で作る宇宙", id: "Alam semesta yang diciptakan dari pertanyaan kita" },
  exploreBtn: { ko: "질문 탐험", en: "Explore", ja: "探検", id: "Jelajahi" },
  randomBtn: { ko: "랜덤 질문", en: "Random", ja: "ランダム", id: "Acak" },
  adminBtn: { ko: "관리자", en: "Admin", ja: "管理者", id: "Admin" },
  createTitle: { ko: "🛰️ 질문 위성 만들기", en: "🛰️ Create a Question Satellite", ja: "🛰️ 質問衛星を作ろう", id: "🛰️ Buat Satelit Pertanyaan" },
  namePlaceholder: { ko: "우주비행사 이름 (닉네임)", en: "Astronaut name (nickname)", ja: "宇宙飛行士の名前（ニックネーム）", id: "Nama astronot (nama panggilan)" },
  questionPlaceholder: { ko: "궁금한 질문을 적어보세요! ✨", en: "Write your question! ✨", ja: "質問を書いてみよう！✨", id: "Tulis pertanyaanmu! ✨" },
  topicGuide: { ko: "🏷️ 어떤 주제의 질문이야? (여러 개 고를 수 있어!)", en: "🏷️ What topic? (You can pick multiple!)", ja: "🏷️ どんなテーマ？（複数選べるよ！）", id: "🏷️ Apa topiknya? (Bisa pilih beberapa!)" },
  etcGuideTitle: { ko: "✏️ '기타'를 골랐구나! 어떤 주제인지 짧게 적어줘!", en: "✏️ You picked 'Other'! Write your topic!", ja: "✏️ 「その他」を選んだね！テーマを書いてね！", id: "✏️ Kamu pilih 'Lainnya'! Tulis topiknya!" },
  etcGuideDesc: { ko: "(예: 음식, 게임, 동물, 우주여행 등 네가 원하는 주제!)", en: "(e.g. food, games, animals, space travel...)", ja: "（例：食べ物、ゲーム、動物、宇宙旅行など）", id: "(contoh: makanan, game, hewan, perjalanan luar angkasa...)" },
  etcInputPlaceholder: { ko: "내가 정한 주제를 적어봐! 🌟", en: "Write your own topic! 🌟", ja: "自分のテーマを書いてね！🌟", id: "Tulis topikmu sendiri! 🌟" },
  launchBtn: { ko: "질문 발사!", en: "Launch!", ja: "質問発射！", id: "Luncurkan!" },
  launching: { ko: "발사 중...", en: "Launching...", ja: "発射中...", id: "Meluncurkan..." },
  totalQuestions: { ko: "개의 질문이 우주를 떠돌고 있어요", en: "questions floating in space", ja: "個の質問が宇宙を漂っています", id: "pertanyaan melayang di angkasa" },
  recentSatellites: { ko: "최근 질문 위성", en: "Recent Question Satellites", ja: "最近の質問衛星", id: "Satelit Pertanyaan Terbaru" },
  recentSatellitesGuide: {
    ko: "✨ 가장 최근에 발사된 새로운 질문 위성들이에요!",
    en: "✨ These are the newest question satellites just launched!",
    ja: "✨ 一番最近発射された新しい質問衛星だよ！",
    id: "✨ Ini adalah satelit pertanyaan terbaru yang baru diluncurkan!",
  },

  // Toasts
  toastName: { ko: "이름을 입력해줘! 🧑‍🚀", en: "Enter your name! 🧑‍🚀", ja: "名前を入力してね！🧑‍🚀", id: "Masukkan namamu! 🧑‍🚀" },
  toastQuestion: { ko: "질문을 입력해줘! 🤔", en: "Enter a question! 🤔", ja: "質問を入力してね！🤔", id: "Masukkan pertanyaan! 🤔" },
  toastLength: { ko: "질문은 300자 이내로 작성해줘!", en: "Question must be under 300 characters!", ja: "質問は300文字以内で！", id: "Pertanyaan harus di bawah 300 karakter!" },
  toastTopic: { ko: "카테고리를 하나 이상 골라줘! 🏷️", en: "Pick at least one category! 🏷️", ja: "カテゴリを1つ以上選んでね！🏷️", id: "Pilih minimal satu kategori! 🏷️" },
  toastEtc: { ko: "기타를 골랐으면 어떤 주제인지 적어줘! ✏️", en: "Write your custom topic! ✏️", ja: "「その他」のテーマを書いてね！✏️", id: "Tulis topik kustommu! ✏️" },
  toastSuccess: { ko: "질문 위성이 발사되었어! 🛰️", en: "Question satellite launched! 🛰️", ja: "質問衛星が発射されたよ！🛰️", id: "Satelit pertanyaan diluncurkan! 🛰️" },
  toastQuestionMark: { ko: "질문스페이스의 규칙! 질문 마지막에 물음표(?)를 넣어줘 ❓", en: "Question Space rule! End your question with a '?' ❓", ja: "質問スペースのルール！質問の最後に「？」を付けてね ❓", id: "Aturan Question Space! Akhiri pertanyaanmu dengan '?' ❓" },

  // Questions page
  exploreTitle: { ko: "질문", en: "Question", ja: "質問", id: "Pertanyaan" },
  exploreTitleSuffix: { ko: "탐험 🔭", en: "Explorer 🔭", ja: "探検 🔭", id: "Jelajah 🔭" },
  allFilter: { ko: "🌌 전체", en: "🌌 All", ja: "🌌 すべて", id: "🌌 Semua" },
  noQuestions: { ko: "아직 질문 위성이 없어요! 🌑", en: "No question satellites yet! 🌑", ja: "まだ質問衛星がないよ！🌑", id: "Belum ada satelit pertanyaan! 🌑" },
  noQuestionsSub: { ko: "홈에서 질문을 발사해보세요!", en: "Launch a question from home!", ja: "ホームから質問を発射しよう！", id: "Luncurkan pertanyaan dari beranda!" },
  home: { ko: "홈으로", en: "Home", ja: "ホームへ", id: "Ke Beranda" },

  // Question Detail
  back: { ko: "뒤로가기", en: "Back", ja: "戻る", id: "Kembali" },
  notFound: { ko: "질문을 찾을 수 없어요 😢", en: "Question not found 😢", ja: "質問が見つかりません 😢", id: "Pertanyaan tidak ditemukan 😢" },
  goHome: { ko: "홈으로 돌아가기", en: "Go Home", ja: "ホームに戻る", id: "Kembali ke Beranda" },
  answers: { ko: "💬 답변", en: "💬 Answers", ja: "💬 回答", id: "💬 Jawaban" },
  noAnswers: { ko: "아직 답변이 없어요! 첫 번째 답변을 달아보세요 ⭐", en: "No answers yet! Be the first to answer ⭐", ja: "まだ回答がないよ！最初の回答をしよう ⭐", id: "Belum ada jawaban! Jadilah yang pertama menjawab ⭐" },
  answerNamePlaceholder: { ko: "이름", en: "Name", ja: "名前", id: "Nama" },
  answerPlaceholder: { ko: "답변을 적어보세요!", en: "Write your answer!", ja: "回答を書いてね！", id: "Tulis jawabanmu!" },
  toastAnswerName: { ko: "이름을 입력해줘!", en: "Enter your name!", ja: "名前を入力してね！", id: "Masukkan namamu!" },
  toastAnswerText: { ko: "답변을 입력해줘!", en: "Enter an answer!", ja: "回答を入力してね！", id: "Masukkan jawaban!" },
  toastAnswerLength: { ko: "답변은 500자 이내로!", en: "Answer must be under 500 characters!", ja: "回答は500文字以内で！", id: "Jawaban harus di bawah 500 karakter!" },
  toastAnswerSuccess: { ko: "답변이 등록되었어! ⭐", en: "Answer posted! ⭐", ja: "回答が登録されたよ！⭐", id: "Jawaban berhasil diposting! ⭐" },
  toastAnswerCooldown: { ko: "댓글은 20초 후에 다시 작성할 수 있어! ⏳", en: "You can post again after 20 seconds! ⏳", ja: "20秒後にまたコメントできるよ！⏳", id: "Kamu bisa posting lagi setelah 20 detik! ⏳" },
  toastAnswerDuplicate: { ko: "이미 똑같은 댓글이 있어! 다른 답변을 써줘 ✨", en: "That answer already exists! Write something different ✨", ja: "同じ回答がすでにあるよ！別の回答を書いてね ✨", id: "Jawaban itu sudah ada! Tulis sesuatu yang berbeda ✨" },

  // Ownership / edit / delete
  origLang: { ko: "원어", en: "Original", ja: "原文", id: "Asli" },
  edit: { ko: "수정", en: "Edit", ja: "編集", id: "Ubah" },
  delete: { ko: "삭제", en: "Delete", ja: "削除", id: "Hapus" },
  save: { ko: "저장", en: "Save", ja: "保存", id: "Simpan" },
  cancel: { ko: "취소", en: "Cancel", ja: "キャンセル", id: "Batal" },
  confirmDeleteQuestion: {
    ko: "이 질문을 정말 삭제할까요? 답변도 함께 사라져요.",
    en: "Delete this question? All answers will be removed too.",
    ja: "この質問を削除しますか？回答も一緒に消えます。",
    id: "Hapus pertanyaan ini? Semua jawaban juga akan dihapus.",
  },
  confirmDeleteComment: {
    ko: "이 답변을 삭제할까요?",
    en: "Delete this answer?",
    ja: "この回答を削除しますか？",
    id: "Hapus jawaban ini?",
  },
  toastQuestionDeleted: { ko: "질문이 삭제되었어요 🗑️", en: "Question deleted 🗑️", ja: "質問が削除されました 🗑️", id: "Pertanyaan dihapus 🗑️" },
  toastQuestionUpdated: { ko: "질문이 수정되었어요 ✏️", en: "Question updated ✏️", ja: "質問が更新されました ✏️", id: "Pertanyaan diperbarui ✏️" },
  toastCommentDeleted: { ko: "답변이 삭제되었어요 🗑️", en: "Answer deleted 🗑️", ja: "回答が削除されました 🗑️", id: "Jawaban dihapus 🗑️" },
  toastCommentUpdated: { ko: "답변이 수정되었어요 ✏️", en: "Answer updated ✏️", ja: "回答が更新されました ✏️", id: "Jawaban diperbarui ✏️" },
  myBadge: { ko: "내 글", en: "Mine", ja: "自分", id: "Milikku" },

  // Random
  randomTitle: { ko: "랜덤", en: "Random", ja: "ランダム", id: "Acak" },
  randomTitleSuffix: { ko: "질문 🎲", en: "Question 🎲", ja: "質問 🎲", id: "Pertanyaan 🎲" },
  noQuestionsYet: { ko: "아직 질문이 없어요! 🌑", en: "No questions yet! 🌑", ja: "まだ質問がないよ！🌑", id: "Belum ada pertanyaan! 🌑" },
  clickToAnswer: { ko: "눌러서 답변 보기 →", en: "Click to see answers →", ja: "クリックして回答を見る →", id: "Klik untuk melihat jawaban →" },
  anotherQuestion: { ko: "다른 질문 보기!", en: "Another question!", ja: "別の質問を見る！", id: "Pertanyaan lain!" },

  // Admin
  adminTitle: { ko: "🔒 관리자 모드", en: "🔒 Admin Mode", ja: "🔒 管理者モード", id: "🔒 Mode Admin" },
  adminPasswordPrompt: { ko: "비밀번호를 입력하세요", en: "Enter password", ja: "パスワードを入力してください", id: "Masukkan kata sandi" },
  adminPasswordPlaceholder: { ko: "비밀번호", en: "Password", ja: "パスワード", id: "Kata sandi" },
  adminEnter: { ko: "입장하기", en: "Enter", ja: "入場する", id: "Masuk" },
  adminMode: { ko: "🛡️ 관리자 모드", en: "🛡️ Admin Mode", ja: "🛡️ 管理者モード", id: "🛡️ Mode Admin" },
  adminManageTitle1: { ko: "질문", en: "Question", ja: "質問", id: "Pertanyaan" },
  adminManageTitle2: { ko: "관리 ⚙️", en: "Management ⚙️", ja: "管理 ⚙️", id: "Manajemen ⚙️" },
  adminTotal: { ko: "총", en: "Total", ja: "合計", id: "Total" },
  adminQuestionUnit: { ko: "개의 질문", en: "questions", ja: "個の質問", id: "pertanyaan" },
  adminNoQuestions: { ko: "질문이 없습니다.", en: "No questions.", ja: "質問がありません。", id: "Tidak ada pertanyaan." },
  adminDeleted: { ko: "질문이 삭제되었어요", en: "Question deleted", ja: "質問が削除されました", id: "Pertanyaan dihapus" },
  adminSaved: { ko: "수정 완료! ✏️", en: "Saved! ✏️", ja: "修正完了！✏️", id: "Disimpan! ✏️" },
  adminLoginSuccess: { ko: "관리자 모드 활성화! 🔓", en: "Admin mode activated! 🔓", ja: "管理者モード有効化！🔓", id: "Mode admin diaktifkan! 🔓" },
  adminLoginFail: { ko: "비밀번호가 틀렸어요! 🔒", en: "Wrong password! 🔒", ja: "パスワードが違います！🔒", id: "Kata sandi salah! 🔒" },

  // Topics
  topicImagination: { ko: "💭 상상", en: "💭 Imagination", ja: "💭 想像", id: "💭 Imajinasi" },
  topicPeople: { ko: "👫 사람", en: "👫 People", ja: "👫 人", id: "👫 Orang" },
  topicDream: { ko: "🌙 꿈", en: "🌙 Dreams", ja: "🌙 夢", id: "🌙 Mimpi" },
  topicHistory: { ko: "📜 역사", en: "📜 History", ja: "📜 歴史", id: "📜 Sejarah" },
  topicScience: { ko: "🔬 과학·기술", en: "🔬 Science", ja: "🔬 科学·技術", id: "🔬 Sains & Teknologi" },
  topicNature: { ko: "🌿 자연", en: "🌿 Nature", ja: "🌿 自然", id: "🌿 Alam" },
  topicEmotion: { ko: "💗 마음·감정", en: "💗 Emotions", ja: "💗 心·感情", id: "💗 Perasaan" },
  topicArt: { ko: "🎨 예술", en: "🎨 Art", ja: "🎨 芸術", id: "🎨 Seni" },
  topicSchool: { ko: "🏫 학교", en: "🏫 School", ja: "🏫 学校", id: "🏫 Sekolah" },
  topicWorry: { ko: "😔 고민", en: "😔 Worries", ja: "😔 悩み", id: "😔 Kekhawatiran" },
  topicEtc: { ko: "✨ 기타", en: "✨ Other", ja: "✨ その他", id: "✨ Lainnya" },

  // Load more
  loadMore: { ko: "더보기", en: "Load more", ja: "もっと見る", id: "Lihat lagi" },
} as const;

type TranslationKey = keyof typeof translations;

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "ko",
  setLang: () => {},
  t: (key) => translations[key].ko,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("question-space-lang");
    return (saved as Lang) || "ko";
  });

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("question-space-lang", newLang);
  };

  const t = (key: TranslationKey) => translations[key][lang];

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// Topic label with i18n
const topicKeyMap: Record<string, TranslationKey> = {
  imagination: "topicImagination",
  people: "topicPeople",
  dream: "topicDream",
  history: "topicHistory",
  science: "topicScience",
  nature: "topicNature",
  emotion: "topicEmotion",
  art: "topicArt",
  school: "topicSchool",
  worry: "topicWorry",
  etc: "topicEtc",
};

export function getTopicLabelI18n(value: string, lang: Lang): string {
  const key = topicKeyMap[value];
  if (key) return translations[key][lang];
  return `✨ ${value}`;
}
