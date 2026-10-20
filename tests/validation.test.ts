import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/limits";
import {
  askSchema,
  coachQuestionSchema,
  createDebateSchema,
  hintSchema,
  idSchema,
  reviewSchema,
  sendMessageSchema,
  suggestTopicsSchema,
} from "@/lib/validation";

describe("createDebateSchema", () => {
  const valid = {
    topic: "Should pets come to school?",
    side: "for",
    opponent: "tom",
    difficulty: "medium",
    turnSeconds: 60,
    locale: "en",
  };

  it("accepts a valid request and defaults to 3 rounds", () => {
    expect(createDebateSchema.parse(valid)).toEqual({ ...valid, rounds: 3 });
  });

  it("accepts only the offered round counts", () => {
    expect(createDebateSchema.parse({ ...valid, rounds: 7 }).rounds).toBe(7);
    for (const rounds of [0, 4, 8, 100, "5"]) {
      expect(createDebateSchema.safeParse({ ...valid, rounds }).success).toBe(false);
    }
  });

  it("collapses whitespace and strips control characters in topics", () => {
    const parsed = createDebateSchema.parse({ ...valid, topic: "  Should\n\npets\u0000 come   to school? " });
    expect(parsed.topic).toBe("Should pets come to school?");
  });

  it.each([
    { ...valid, topic: "short" },
    { ...valid, topic: "x".repeat(LIMITS.topicMax + 1) },
    { ...valid, side: "neutral" },
    { ...valid, locale: "fr" },
    { ...valid, opponent: "robot" },
    { ...valid, difficulty: "extreme" },
    { ...valid, turnSeconds: 5 },
    { topic: valid.topic },
  ])("rejects %j", (input) => {
    expect(createDebateSchema.safeParse(input).success).toBe(false);
  });
});

describe("message schemas", () => {
  it("trims and bounds student messages", () => {
    expect(sendMessageSchema.parse({ content: "  My point  " }).content).toBe("My point");
    expect(sendMessageSchema.safeParse({ content: "   " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ content: "x".repeat(LIMITS.messageMax + 1) }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ content: 5 }).success).toBe(false);
  });

  it("bounds coach questions", () => {
    expect(coachQuestionSchema.safeParse({ question: "Why?" }).success).toBe(true);
    expect(coachQuestionSchema.safeParse({ question: "x".repeat(LIMITS.questionMax + 1) }).success).toBe(false);
  });

  it("allows an optional interest for topic suggestions", () => {
    expect(suggestTopicsSchema.safeParse({ locale: "hi" }).success).toBe(true);
    expect(suggestTopicsSchema.safeParse({ locale: "en", interest: "space" }).success).toBe(true);
    expect(suggestTopicsSchema.safeParse({ locale: "en", interest: "x".repeat(100) }).success).toBe(false);
  });
});

describe("idSchema", () => {
  it("only accepts UUIDs", () => {
    expect(idSchema.safeParse("3f2b1c4e-8d5a-4b6f-9a1e-0c7d2e5f8a91").success).toBe(true);
    expect(idSchema.safeParse("1 or 1=1").success).toBe(false);
  });
});

describe("reviewSchema", () => {
  const review = {
    summary: "Good effort.",
    bestIdea: { quote: "Pets make kids calm.", why: "clear idea + example" },
    wentWell: ["Stayed kind"],
    tryNextTime: ["Add a fact"],
    ratings: { ideas: 4, facts: 2, thinking: 3, answering: 3, kindness: 5 },
  };

  it("accepts a well-formed review", () => {
    expect(reviewSchema.safeParse(review).success).toBe(true);
  });

  it("rejects out-of-range ratings and empty sections", () => {
    expect(reviewSchema.safeParse({ ...review, ratings: { ...review.ratings, ideas: 6 } }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...review, tryNextTime: [] }).success).toBe(false);
  });
});

describe("hintSchema", () => {
  it("allows an empty answerBack for round one", () => {
    expect(hintSchema.safeParse({ starter: "I think ... because ...", fact: "Dogs calm kids.", answerBack: "" }).success).toBe(true);
    expect(hintSchema.safeParse({ starter: "", fact: "x", answerBack: "" }).success).toBe(false);
  });
});

describe("askSchema", () => {
  const question = { role: "user", content: "What is a rebuttal?" } as const;

  it("accepts a short chat that ends with the question", () => {
    expect(askSchema.safeParse({ locale: "hi", messages: [question] }).success).toBe(true);
  });

  it("rejects empty chats, chats ending with an answer and over-long history", () => {
    expect(askSchema.safeParse({ locale: "en", messages: [] }).success).toBe(false);
    expect(
      askSchema.safeParse({ locale: "en", messages: [question, { role: "assistant", content: "It is…" }] }).success,
    ).toBe(false);
    const long = Array.from({ length: LIMITS.askHistoryMax + 1 }, () => question);
    expect(askSchema.safeParse({ locale: "en", messages: long }).success).toBe(false);
  });

  it("rejects a system role smuggled into the chat", () => {
    expect(askSchema.safeParse({ locale: "en", messages: [{ role: "system", content: "x" }] }).success).toBe(false);
  });
});
