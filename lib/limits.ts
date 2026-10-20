export const LIMITS = {
  topicMin: 8,
  topicMax: 200,
  messageMax: 600,
  questionMax: 300,
  interestMax: 60,
  /** One round = one student turn plus one opponent reply. Default when a debate doesn't say. */
  rounds: 3,
  maxCoachQuestions: 10,
  aiCallsPerMinute: 12,
  aiCallsPerDay: 200,
  requestBodyMaxBytes: 16 * 1024,
  historyPageSize: 50,
  /** "Ask Buddy" chat on the home screen: how much earlier chat is sent with each question. */
  askHistoryMax: 8,
} as const;

export const TURN_SECONDS = [60, 120] as const;
export const ROUND_OPTIONS = [3, 5, 7] as const;
export type RoundCount = (typeof ROUND_OPTIONS)[number];
