module.exports = {
  apps: [
    {
      name: 'cw-api',
      script: './src/server.js',
      cwd: '/home/deploy/clawwarriors/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      error_file: '/home/deploy/clawwarriors/logs/api-error.log',
      out_file: '/home/deploy/clawwarriors/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'cw-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/deploy/clawwarriors/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      error_file: '/home/deploy/clawwarriors/logs/web-error.log',
      out_file: '/home/deploy/clawwarriors/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
