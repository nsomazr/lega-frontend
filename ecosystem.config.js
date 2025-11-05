// PM2 Ecosystem Configuration for Lega Frontend
// Alternative to using deploy.sh - you can use: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'lega-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/lega-frontend', // Update this path
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_API_URL: 'https://api.lego.nileagi.com',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};

