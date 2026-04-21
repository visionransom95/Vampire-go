require('dotenv').config();
const chalk = require('chalk');
const os = require('os');
const { server } = require('./app');
const { PORT } = require('./config/env');

// Get network interfaces
const getNetworkInterfaces = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  Object.values(interfaces).forEach((nets) => {
    if (!nets) return;
    nets.forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    });
  });

  return addresses;
};

// Log server information
const logServerInfo = (port) => {
  const localUrl = `http://localhost:${port}`;
  const networkUrls = getNetworkInterfaces().map(ip => `http://${ip}:${port}`);

  console.log(chalk.yellow(`\n🚀 Server running on port ${port}`));
  console.log(chalk.green(`  Local:   ${localUrl}`));
  
  if (networkUrls.length > 0) {
    console.log(chalk.blue('\nNetwork Accessible at:'));
    networkUrls.forEach((url, i) => {
      console.log(chalk.blue(`  ${i + 1}. ${url}`));
    });
  }
  console.log(''); // Add a newline at the end
};

// Log server info when server starts
server.on('listening', () => {
  logServerInfo(PORT);
});

// Handle server errors
server.on('error', (error) => {
  console.error(chalk.red('Server error:'), error);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log(chalk.yellow('\nSIGTERM received. Shutting down gracefully...'));
  server.close(() => {
    console.log(chalk.green('Server closed.'));
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\nSIGINT received. Shutting down gracefully...'));
  server.close(() => {
    console.log(chalk.green('Server closed.'));
    process.exit(0);
  });
});
