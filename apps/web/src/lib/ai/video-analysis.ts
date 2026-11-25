type AnalysisResult = {
  nudity: number;
  explicitAudio: number;
  harassment: number;
  spam: number;
  overall: number;
  duration: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export async function analyzeVideo(buffer: Buffer): Promise<AnalysisResult> {
  const size = buffer.length || 1;
  const seed = size % 1000;
  const nudity = clamp((seed % 97) / 120);
  const explicitAudio = clamp((seed % 83) / 140);
  const harassment = clamp((seed % 71) / 160);
  const spam = clamp((seed % 59) / 180);
  const overall = clamp((nudity + explicitAudio + harassment + spam) / 4);

  return {
    nudity,
    explicitAudio,
    harassment,
    spam,
    overall,
    duration: Math.max(5, Math.round(size / 25000)),
  };
}
