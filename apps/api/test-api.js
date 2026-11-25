try {
  console.log('Starting test...');
  require('./dist/main.js');
  console.log('Module loaded');
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}
