// server.js — Entry point: loads env vars and starts the HTTP server
require('dotenv').config();

// Catch silent crashes so Railway logs show the real error
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

const app = require('./app');
const { startScheduledJobs } = require('./services/scheduledJobs');

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Required for Railway — must bind to all interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 ProgramLink API running on ${HOST}:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);

  // Start background jobs after server is up
  startScheduledJobs();
});
