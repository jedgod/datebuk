export type ModerationThresholds = {
  nudity: number;
  explicitAudio: number;
  harassment: number;
  spam: number;
};

export const INTENT_THRESHOLDS: Record<string, ModerationThresholds> = {
  FAITH: {
    nudity: 0.30,
    explicitAudio: 0.25,
    harassment: 0.20,
    spam: 0.15,
  },
  CASUAL: {
    nudity: 0.55,
    explicitAudio: 0.45,
    harassment: 0.35,
    spam: 0.25,
  },
  PROFESSIONAL: {
    nudity: 0.20,
    explicitAudio: 0.15,
    harassment: 0.10,
    spam: 0.30,
  },
  DEFAULT: {
    nudity: 0.45,
    explicitAudio: 0.40,
    harassment: 0.30,
    spam: 0.25,
  },
};

type ScoreMap = Record<keyof ModerationThresholds, number>;

type AutoQuarantineArgs = {
  intent?: string;
  scores: Partial<ScoreMap>;
};

export function shouldAutoQuarantine({ intent, scores }: AutoQuarantineArgs): boolean {
  const key = intent ?? "DEFAULT";
  const thresholds = INTENT_THRESHOLDS[key] ?? INTENT_THRESHOLDS.DEFAULT;

  return (
    (scores.nudity ?? 0) > thresholds.nudity ||
    (scores.explicitAudio ?? 0) > thresholds.explicitAudio ||
    (scores.harassment ?? 0) > thresholds.harassment ||
    (scores.spam ?? 0) > thresholds.spam
  );
}
