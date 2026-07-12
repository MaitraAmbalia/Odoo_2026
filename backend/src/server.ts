import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './config/socket';

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start listening
server.listen(env.PORT, () => {
  console.log(`AssetFlow server running on http://localhost:${env.PORT}`);
  console.log(`Socket.io attached`);
  console.log(`Uploads served from ${env.UPLOAD_DIR}`);
});

export default server;
