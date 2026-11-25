module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // nanoid v5 ships ESM-only; without this it's left un-transformed and any spec that
  // transitively imports it (most auth/uploads code) fails with a SyntaxError. pnpm
  // nests real packages under node_modules/.pnpm/<name>@<version>/node_modules/<name>,
  // so the exclusion has to look past the .pnpm virtual store segment.
  transformIgnorePatterns: ['node_modules/\\.pnpm/(?!nanoid@)'],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
