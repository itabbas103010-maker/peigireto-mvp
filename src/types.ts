export interface ProductivityDna {
  procrastinationType: string;
  motivationStyle: string;
  bestFocusHours: string;
  attentionSpan: string;
  distractionTriggers: string;
  consistencyScore: number;
  profileAnalysis: string;
}

export interface UserProfile {
  hasCompletedOnboarding: boolean;
  phoneNumber?: string;
  fullName?: string;
  remindersEnabled?: boolean;
  reminderTimes?: {
    morning: string;
    midday: string;
    evening: string;
    night: string;
  };
  goal: string;
  why: string;
  failConsequence: string;
  distractions: string;
  procrastinationCauses: string;
  peakEnergyTime: string;
  dailyHours: string;
  personality: "Commander" | "Friend" | "Mentor";
  dna?: ProductivityDna;
}

export interface Task {
  id: string;
  title: string;
  status: "pending" | "completed" | "avoided";
  createdAt: string;
  avoidanceCount: number; // For Escape Detection
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mostImportantOutcome: string;
  tasks: Task[];
  morningCompleted: boolean;
  middayCompleted: boolean;
  middayReason?: "Fear of failure" | "Perfectionism" | "Fatigue" | "Ambiguity" | "Distraction" | "Lack of interest";
  middayIntervention?: string;
  eveningCompleted: boolean;
  eveningProgress?: string;
  eveningStoppedUs?: string;
  tomorrowFirstAction?: string;
  nightConfession?: string;
  confessionCompleted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  createdAt: string;
  isVoice?: boolean;
}

export interface AnalyticsReport {
  generatedAt: string;
  bestFocusHours: string;
  biggestDistraction: string;
  mostCommonProcrastinationReason: string;
  motivationProfile: string;
  consistencyScore: number;
  productivityTrend: string;
  goalCompletionProbability: number;
  personalizedRecommendations: string[];
  fullPsychologicalExpertise: string;
}

export type ThemeMode = "dark" | "light";
