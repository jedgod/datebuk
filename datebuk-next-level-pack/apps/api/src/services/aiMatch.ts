export type MatchInput = {
  interests: string[];
  goals: string[];
  lifestyle: string[];
  candidate: { interests: string[]; goals: string[]; lifestyle: string[] };
};

function overlap(a: string[], b: string[]) {
  const set = new Set(a.map(x => x.toLowerCase()));
  return b.filter(x => set.has(x.toLowerCase())).length;
}

export function scoreMatch(input: MatchInput) {
  const interestScore = overlap(input.interests, input.candidate.interests) * 12;
  const goalScore = overlap(input.goals, input.candidate.goals) * 20;
  const lifestyleScore = overlap(input.lifestyle, input.candidate.lifestyle) * 10;
  const score = Math.min(100, 30 + interestScore + goalScore + lifestyleScore);
  return {
    score,
    label: score >= 85 ? 'Excellent Match' : score >= 70 ? 'Strong Match' : score >= 55 ? 'Possible Match' : 'Low Match',
    reasons: [
      'Shared relationship goals',
      'Compatible interests',
      'Lifestyle alignment',
      'Communication potential'
    ]
  };
}
