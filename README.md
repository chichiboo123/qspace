# 🛰️ Q-SPACE

> 우리들의 질문으로 만드는 우주 · *A universe made from our questions*

🇰🇷 질문을 위성처럼 우주로 발사하고, 서로의 답변으로 채워가는 인터랙티브 질문 커뮤니티입니다. 교육뮤지컬 꿈꾸는 치수쌤이 만들었습니다.

🇬🇧 An interactive question community where you launch your questions like satellites into space and fill them up with each other's answers. Created by Chisu (교육뮤지컬 꿈꾸는 치수쌤).

> 🌐 한국어 안내가 먼저 나오고, 그 아래 영어(English) 안내가 이어집니다.

---

## ✨ 주요 기능 · Features

### 🚀 질문 발사 · Question Launch
🇰🇷
- 닉네임과 질문을 입력하고 카테고리를 선택해 질문 위성을 발사
- **규칙**: 질문 마지막에 반드시 `?` 포함, 300자 이내
- 카테고리 복수 선택 및 기타(직접 입력) 지원

🇬🇧
- Enter a nickname and a question, pick categories, and launch your question satellite.
- **Rule**: every question must end with `?` and stay within 300 characters.
- Multiple categories supported, plus a custom "Other" category.

### 🔭 질문 탐험 & 랜덤 · Explore & Random
🇰🇷
- 전체 질문 목록 조회 및 카테고리 필터링, 더보기로 순차 로딩
- 랜덤 모드에서 무작위 질문을 뽑아 바로 답변

🇬🇧
- Browse all questions with category filters and incremental "load more".
- Random mode picks a question at random so you can answer right away.

### 💬 답변 · Comments
🇰🇷
- 질문 상세 페이지에서 답변 작성 및 수정 (500자 이내)
- **중복 답변 방지**, 등록 후 **20초 쿨다운**, 전송 중 버튼 비활성화

🇬🇧
- Write and edit answers on the question detail page (up to 500 characters).
- **Duplicate answers blocked**, a **20-second cooldown** after posting, and the button is disabled while sending.

### 🪪 내 글 관리 · My Posts
🇰🇷
- 내가 쓴 질문/답변에 **내 글** 배지 표시, 수정·삭제 가능
- 작성 시 서버가 발급한 비밀 토큰으로 본인만 수정·삭제할 수 있도록 검증

🇬🇧
- Your own questions and answers get a **My Post** badge and can be edited or deleted.
- A secret token issued by the server when you post ensures only you can edit or delete it.

### 🌏 다국어 지원 · Multilingual
🇰🇷
- 한국어(KOR) / English(ENG) / 日本語(JPN) / Bahasa Indonesia(IDN) 전환
- 등록·수정 시 서버가 본문을 4개 언어로 자동 번역해 번역 모드로 표시
- 선택한 언어는 저장되어 유지

🇬🇧
- Switch between Korean, English, Japanese, and Indonesian.
- The server auto-translates content into all four languages on post/edit and shows it in translation mode.
- Your language choice is remembered.

---

## 🗂️ 카테고리 · Categories

| 카테고리 · Category | 설명 · Description |
|----------|------|
| 💭 상상 | Imagination |
| 👫 사람 | People |
| 🌙 꿈 | Dreams |
| 📜 역사 | History |
| 🔬 과학·기술 | Science & Tech |
| 🌿 자연 | Nature |
| 💗 마음·감정 | Emotions |
| 🎨 예술 | Art |
| 🏫 학교 | School |
| 😔 고민 | Worries |
| ✨ 기타 | Other (직접 입력 · custom) |

---

## 🛠️ 기술 스택 · Tech Stack

| 분류 · Category | 기술 · Stack |
|------|------|
| 프레임워크 · Framework | React 18 + TypeScript |
| 번들러 · Bundler | Vite |
| 스타일 · Styling | Tailwind CSS |
| UI 컴포넌트 · UI | shadcn/ui + Radix UI |
| 애니메이션 · Animation | Framer Motion |
| 라우팅 · Routing | React Router v6 (HashRouter) |
| 상태관리 · State | React Query (TanStack) |
| 알림 · Toasts | Sonner |
| 백엔드 · Backend | Google Apps Script (REST API) |
| 테스트 · Testing | Vitest + Testing Library |

---

## 🔌 데이터 백엔드 설정 · Backend Setup

🇰🇷 질문/답변 데이터는 **내 Google 스프레드시트**에 저장됩니다. 앱을 처음 띄우기 전에 나만의 빈 백엔드를 한 번 만들어야 합니다.

1. [`backend/README.md`](./backend/README.md) 의 안내에 따라 Google Apps Script 웹앱을 배포합니다.
2. 배포 URL 을 `.env` 에 넣습니다.

🇬🇧 All question/answer data is stored in **your own Google Spreadsheet**. Before the first run, create your own empty backend once.

1. Deploy the Google Apps Script web app by following [`backend/README.md`](./backend/README.md).
2. Put the deployment URL into `.env`.

```sh
cp .env.example .env
# .env 안의 VITE_API_URL 을 내 배포 URL 로 변경
# Set VITE_API_URL in .env to your deployment URL
```

🇰🇷 설정을 마치면 모든 질문/답변이 **내 시트**에 저장되며, 처음에는 데이터가 비어 있습니다.
🇬🇧 Once configured, everything is stored in **your sheet**, starting completely empty.

---

## 💻 로컬 실행 · Run Locally

```sh
# 1. 저장소 클론 · Clone
git clone <YOUR_GIT_URL>
cd qspace

# 2. 의존성 설치 · Install dependencies
npm install

# 3. 백엔드 URL 설정 · Configure backend URL (see "Backend Setup")
cp .env.example .env

# 4. 개발 서버 · Dev server
npm run dev

# 5. 빌드 · Build
npm run build

# 6. 테스트 · Test
npm test
```

---

## 📁 프로젝트 구조 · Project Structure

```
src/
├── pages/
│   ├── Index.tsx          # 메인 홈 (질문 발사) · Home / launch
│   ├── Questions.tsx      # 질문 탐험 · Explore
│   ├── QuestionDetail.tsx # 질문 상세 + 답변 · Detail + answers
│   ├── RandomQuestion.tsx # 랜덤 질문 · Random
│   └── NotFound.tsx       # 404
├── components/
│   ├── StarField.tsx      # 별 배경 애니메이션 · Star background
│   ├── SatelliteIcon.tsx  # 위성 아이콘 · Satellite icon
│   ├── LangSwitcher.tsx   # 언어 전환 · Language switcher
│   ├── NavLink.tsx        # 네비게이션 링크 · Nav link
│   └── HelpButton.tsx     # 도움말 · Help
└── lib/
    ├── api.ts             # Google Apps Script API 연동 · API client
    ├── i18n.tsx           # 다국어 지원 · i18n (ko/en/ja/id)
    ├── ownership.ts       # 내 글 식별 · My-post tokens (localStorage)
    ├── questions.ts       # 카테고리 데이터 · Category data
    └── utils.ts           # 유틸리티 · Utilities

backend/
├── Code.gs               # Google Apps Script 백엔드 · Backend
└── README.md             # 백엔드 배포 가이드 · Deployment guide
```

---

## 🙏 아이디어 존중 · Respect the Ideas

🇰🇷 이 프로젝트와 그 안에 담긴 아이디어, 기획, 디자인, 콘텐츠는 모두 정성껏 만들어졌습니다. 코드를 살펴보고 영감을 얻는 것은 환영하지만, **아이디어와 결과물을 존중해 주세요.** 그대로 복제하거나 무단으로 가져다 쓰지 말아 주시길 부탁드립니다.

🇬🇧 This project — along with its ideas, concept, design, and content — was made with great care. You're welcome to look at the code for inspiration, but please **respect the ideas and the work.** Kindly do not copy or reuse it without permission.

---

## 📄 라이선스 · License

🇰🇷 **All rights reserved.** 별도의 라이선스를 부여하지 않습니다. 명시적인 허락 없이 이 코드와 콘텐츠를 복제·배포·수정·재사용할 수 없습니다.

🇬🇧 **All rights reserved.** No license is granted. You may not copy, distribute, modify, or reuse this code or content without explicit permission.

---

*created by. 교육뮤지컬 꿈꾸는 치수쌤*
