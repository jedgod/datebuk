export const COUNTRY_TO_CONTINENT = {
  US: 'North America', CA: 'North America', MX: 'North America',
  GH: 'Africa', NG: 'Africa', ZA: 'Africa', KE: 'Africa', EG: 'Africa',
  GB: 'Europe', FR: 'Europe', DE: 'Europe', IT: 'Europe', ES: 'Europe',
  CN: 'Asia', JP: 'Asia', IN: 'Asia', KR: 'Asia', PH: 'Asia',
  BR: 'South America', AR: 'South America', CL: 'South America', CO: 'South America',
  AU: 'Oceania', NZ: 'Oceania'
};

export function getContinent(countryCode) {
  return COUNTRY_TO_CONTINENT[countryCode?.toUpperCase()] || 'Unknown';
}
