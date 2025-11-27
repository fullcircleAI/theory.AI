export type Language = 'en' | 'nl' | 'ar';

// Web Speech API declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type Question = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  explanation: string;
  subject: string;
  imageUrl?: string;
  imageHint?: string;
};

export type PerformanceMetrics = {
  totalTests: number;
  averageScore: number;
  categoryBreakdown: {
    [category: string]: {
      count: number;
      averageScore: number;
    };
  };
};

export type PracticeResult = {
  category: string;
  score: number;
  total: number;
  date: string;
};

export interface LanguageStrings {
  // Common
  welcome: string;
  loading: string;
  error: string;
  success: string;
  next: string;
  back: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  close: string;
  yes: string;
  no: string;
  
  // Navigation
  navigation: {
    dashboard: string;
    practice: string;
    mockExam: string;
    chat: string;
    settings: string;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    welcomeMessage: string;
    welcomeSubtitle: string;
    startPractice: string;
    performanceTracker: string;
    testsCompleted: string;
    averageScore: string;
    categoryPerformance: string;
    focusAreas: string;
    focusNote: string;
    upgradeToPremium: string;
    upgradeDescription: string;
    upgradeNow: string;
    doingAmazing: string;
    makingProgress: string;
    readyToStart: string;
    woohoo: string;
    youGotThis: string;
    firstWin: string;
    examReadiness: string;
    yourJourney: string;
    studyTime: string;
    timeRemaining: string;
    yourProgress: string;
    todayFocus: string;
    needsAttention: string;
    focusOnThis: string;
    startMockExam: string;
    readyToTest: string;
    notPracticedYet: string;
    readyToStartLearning: string;
    startWithBasics: string;
    practiceMore: string;
    continueBuilding: string;
    excellentMastery: string;
    strongPerformance: string;
    goodProgress: string;
    buildingSkills: string;
  loadingProgress: string;
  analyzingData: string;
  recommendation: string;
  mockExamsAvailable: string;
  allTestsCompleted: string;
  startFirstTest: string;
  focus: string;
  strength: string;
  noWeakAreas: string;
  maintainStrength: string;
  completeTestsForStrength: string;
  aiAdaptive: string;
  weakAreaFocus: string;
  aiPersonalized: string;
  goalAchieved: string;
  goalProgress: string;
  aiIdentifiedWeakArea: string;
  aiRecommendsFocus: string;
  currentScore: string;
  targetScore: string;
  toGo: string;
  personalizedExamInfo: string;
  examFocusedOn: string;
  examTailored: string;
  };
  
  settings: {
    title: string;
    account: string;
    language: string;
    privacy: string;
    terms: string;
    faq: string;
    support: string;
    about: string;
    enterUsername: string;
    supportSubject: string;
    supportMessage: string;
    faqData: {
      progressTracking: { question: string; answer: string; };
      dataSecurity: { question: string; answer: string; };
      offlineUse: { question: string; answer: string; };
      aiCoach: { question: string; answer: string; };
      dataLoss: { question: string; answer: string; };
    };
  };
  
  achievements: {
    firstTest: { title: string; description: string; };
    oneHour: { title: string; description: string; };
    fiveHours: { title: string; description: string; };
    seventyPercent: { title: string; description: string; };
    eightyFivePercent: { title: string; description: string; };
    firstMock: { title: string; description: string; };
    hundredQuestions: { title: string; description: string; };
    fiveHundredQuestions: { title: string; description: string; };
  };
  
  testNames: {
    trafficLightsSignals: string;
    priorityRules: string;
    hazardPerception: string;
    speedSafety: string;
    bicycleInteractions: string;
    roundaboutRules: string;
    tramInteractions: string;
    pedestrianCrossings: string;
    constructionZones: string;
    weatherConditions: string;
    roadSigns: string;
    motorwayRules: string;
    vehicleKnowledge: string;
    parkingRules: string;
    environmental: string;
    technologySafety: string;
  alcoholDrugs: string;
  fatigueRest: string;
  emergencyProcedures: string;
  insightPractice: string;
  mockTest: string;
  };
  
  // AI Tutor
  aiTutor: {
    title: string;
    welcome: string;
    error: string;
    actionItems: string;
    nextSteps: string;
    inputPlaceholder: string;
    quickQuestions: {
      title: string;
    };
  };
  
  // Exam Date
  examDate: {
    title: string;
    selectDate: string;
    skip: string;
    continue: string;
    continuing: string;
  };
  
  // Install
  install: {
    title: string;
    description: string;
    mobileMessage: string;
    installNow: string;
    maybeLater: string;
  };
  
  // Progress Tracker
  progressTracker: {
    title: string;
    emptyMessage: string;
    testsCompleted: string;
    averageScore: string;
    dayStreak: string;
    examReady: string;
    recentPerformance: string;
    focusAreas: string;
    strongAreas: string;
    noWeakAreas: string;
    noStrongAreas: string;
    practiceWeakAreas: string;
    takeMockExam: string;
    improving: string;
    declining: string;
  };
  
  // Practice
  practice: {
    title: string;
    startTest: string;
    recommendedForYou: string;
    hazardPerception: string;
    insightPractice: string;
    mandatorySigns: string;
    warningSigns: string;
    prohibitorySigns: string;
    prohibitorySigns2: string;
    trafficLightsSignals: string;
    roadInformation: string;
    signIdentification: string;
    priorityRules: string;
    mandatorySigns2: string;
    premium: string;
    question: string;
    of: string;
    timeLeft: string;
    nextQuestion: string;
    finishTest: string;
    explanation: string;
    listening: string;
    sayABCD: string;
    voiceMode: string;
    mute: string;
    unmute: string;
    mockExam: string;
  };
  
  // Chat
  chat: {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    emptyState: string;
    typing: string;
  };
  
  // Results
  results: {
    title: string;
    congratulations: string;
    wellDone: string;
    keepPracticing: string;
    score: string;
    correct: string;
    incorrect: string;
    totalQuestions: string;
    percentage: string;
    timeSpent: string;
    backToPractice: string;
    tryAgain: string;
    shareResults: string;
  };
  
  // Language Selection
  languageSelection: {
    title: string;
    subtitle: string;
    english: string;
    dutch: string;
    arabic: string;
  };
  
  // Test Categories
  testCategories: {
    hazardPerception: string;
    insightPractice: string;
    mandatorySigns: string;
    warningSigns: string;
    prohibitorySigns: string;
    prohibitorySigns2: string;
    trafficLightsSignals: string;
    roadInformation: string;
    signIdentification: string;
    priorityRules: string;
    mandatorySigns2: string;
    mockExam: string;
  };
  
  // Mock Exam Bio
  mockExamBio: {
    title: string;
    subtitle: string;
    examOverview: string;
    questions: string;
    questionsDesc: string;
    timeLimit: string;
    timeLimitDesc: string;
    passRate: string;
    passRateDesc: string;
    randomQuestions: string;
    randomQuestionsDesc: string;
    topicsCovered: string;
    trafficLights: string;
    roadSigns: string;
    hazardPerception: string;
    priorityRules: string;
    roadInformation: string;
    insightPractice: string;
    instructions: string;
    instruction1: string;
    instruction2: string;
    instruction3: string;
    instruction4: string;
    instruction5: string;
    practiceRequirement: string;
    progressComplete: string;
    readyTitle: string;
    readyMessage: string;
    almostTitle: string;
    almostMessage: string;
    practiceTitle: string;
    practiceMessage: string;
    startMockExam: string;
    continuePracticing: string;
    startPracticing: string;
    completedTests: string;
    noTestsCompleted: string;
    backToDashboard: string;
  };
  
  // Quiz
  quiz: {
    title: string;
    subtitle: string;
    officialStyle: string;
    questions: string;
    timeLimit: string;
    passRate: string;
    testType: string;
    computerBased: string;
    variesByCategory: string;
    instructions: string;
    instruction1: string;
    instruction2: string;
    instruction3: string;
    instruction4: string;
    instruction5: string;
    warning: string;
    startQuiz: string;
    loading: string;
    timeLeft: string;
    question: string;
    finishQuiz: string;
    previous: string;
    next: string;
    cancel: string;
    finishQuizConfirm: string;
    finishQuizMessage: string;
    answeredQuestions: string;
    results: string;
    score: string;
    correct: string;
    incorrect: string;
    totalQuestions: string;
    percentage: string;
    timeSpent: string;
    backToPractice: string;
    tryAgain: string;
    shareResults: string;
    congratulations: string;
    wellDone: string;
    keepPracticing: string;
    passed: string;
    failed: string;
    excellent: string;
    great: string;
    good: string;
    close: string;
    needPractice: string;
    backToQuizzes: string;
    requirement: string;
    requirementText: string;
    questionsLabel: string;
    minutesLabel: string;
    passMarkLabel: string;
    completePracticeToUnlock: string;
  };
  
  // Quiz Selection
  quizSelection: {
    title: string;
    subtitle: string;
    level1: {
      title: string;
      subtitle: string;
      description: string;
      passRate: string;
    };
    level2: {
      title: string;
      subtitle: string;
      description: string;
      passRate: string;
    };
    level3: {
      title: string;
      subtitle: string;
      description: string;
      passRate: string;
    };
    difficulty: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
    questions: string;
    timeLimit: string;
    passRate: string;
    startQuiz: string;
    footer: string;
    status: {
      completed: string;
      attempted: string;
      available: string;
      locked: string;
    };
    bestScore: string;
    locked: string;
    unlockMessage: string;
    progress: string;
  };
  
  // Voice Commands
  voiceCommands: {
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    first: string;
    second: string;
    third: string;
    fourth: string;
    one: string;
    two: string;
    three: string;
    four: string;
  };
} 