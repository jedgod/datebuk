export function rankProfiles(viewer, profiles, preference) {
  const scope = preference?.matchScope || 'SAME_CONTINENT';
  return profiles
    .map(profile => {
      let score = profile.baseScore || 50;
      if (viewer.city && viewer.city === profile.city) score += 30;
      if (viewer.countryCode && viewer.countryCode === profile.countryCode) score += 25;
      if (viewer.continent && viewer.continent === profile.continent) score += 20;
      if (scope === 'SAME_COUNTRY' && viewer.countryCode !== profile.countryCode) score -= 60;
      if (scope === 'SAME_CONTINENT' && viewer.continent !== profile.continent) score -= 40;
      if (scope === 'GLOBAL') score += 5;
      return { ...profile, regionalScore: score };
    })
    .filter(p => scope === 'GLOBAL' || p.regionalScore >= 35)
    .sort((a, b) => b.regionalScore - a.regionalScore);
}
