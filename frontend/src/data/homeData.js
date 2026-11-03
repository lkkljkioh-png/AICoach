
/**
 * 홈 화면 주요 기능 소개
 */
export const FEATURES = [
  {
    number: "01",
    icon: "analysis",
    title: "코드 분석",
    desc: "정답 여부만 알려주지 않아요. 틀린 줄을 표시하고, 왜 그렇게 동작하는지 풀어서 설명합니다.",
    caption: "막힌 부분을 정확하게 이해하기",
  },
  {
    number: "02",
    icon: "recommend",
    title: "맞춤 문제 추천",
    desc: "자주 틀리는 유형을 기억해 두었다가, 약한 부분을 채우는 문제를 다음에 보여줘요.",
    caption: "나에게 필요한 문제로 이어가기",
  },
  {
    number: "03",
    icon: "history",
    title: "풀이 기록",
    desc: "제출한 코드와 AI 피드백이 문제별로 남아서, 며칠 뒤에 다시 봐도 어디서 막혔는지 기억나요.",
    caption: "해결 과정을 쌓아 가기",
  },
];

/**
 * 학습 진행 단계
 */
export const STEPS = [
  {
    title: "문제를 고르고 풀기",
    desc: "난이도를 고르면 편집기가 바로 열려요. 설치할 건 없어요.",
  },
  {
    title: "제출하고 피드백 받기",
    desc: "테스트 결과와 함께 막힌 줄에 대한 설명이 도착해요.",
  },
  {
    title: "추천 문제로 이어가기",
    desc: "방금 놓친 개념을 연습할 다음 문제가 준비돼요.",
  },
];

/**
 * 메인 화면에서 사용하는 코드 분석 데모
 */
export const HOME_CODE_DEMO = {
  filename: "solution.py",
  title: "짝수만 더하기",

  buggyCode: [
    "def solution(numbers):",
    "    result = 0",
    "    for n in numbers:",
    "        result += n",
    "    return result",
  ],

  fixedCode: [
    "def solution(numbers):",
    "    result = 0",
    "    for n in numbers:",
    "        if n % 2 == 0:",
    "            result += n",
    "    return result",
  ],

  feedback: {
    incorrect: {
      title: "4번째 줄 확인 필요",
      message:
        "모든 수를 더하고 있어요. 문제는 짝수만 더하는 거예요. if n % 2 == 0: 조건을 먼저 걸어 보세요.",
      passedTests: 1,
    },

    correct: {
      title: "분석 완료",
      message:
        "짝수만 골라 더하고 있어요. 다음 문제에서는 조건식을 한 줄로 쓰는 방법을 연습해 볼까요?",
      passedTests: 3,
    },
  },

  totalTests: 3,
  errorLine: 4,
};
