import { createApp } from './app';
import config, { validateConfig } from './config';
import Database from './database';

/**
 * Start the server
 */
async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Test database connection
    const dbConnected = await Database.testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Create and start app
    const app = createApp();
    
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🚗 Airport Parking API Server');
      console.log('='.repeat(50));
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📄 API Version: ${config.apiVersion}`);
      console.log(`🔗 URL: http://localhost:${config.port}`);
      console.log(`📚 Health: http://localhost:${config.port}/api/${config.apiVersion}/health`);
      console.log('='.repeat(50));
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        await Database.close();
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
