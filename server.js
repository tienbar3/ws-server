const WebSocket = require('ws');
const net = require('net');

const PORT = process.env.PORT || 8080;
const POOL_HOST = process.env.POOL_HOST || 'pool.supportxmr.com';
const POOL_PORT = process.env.POOL_PORT || 3333;

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`[WS] Connecting from ${clientIP} -> ${POOL_HOST} (${POOL_PORT})`);

  const tcp = net.createConnection(POOL_PORT, POOL_HOST, () => {
    console.log(`[TCP] Connected from ${clientIP} -> ${POOL_HOST} (${POOL_PORT})`);
  });

  ws.on('message', (data) => {
    if (tcp.writable) tcp.write(data);
  });

  tcp.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });

  ws.on('close', () => {
    console.log(`[TCP] Pool socket closed for ${POOL_HOST} (${POOL_PORT})`);
    tcp.destroy();
  });

  tcp.on('close', () => {
    ws.close();
  });

  ws.on('error', (err) => console.error('[WS Error]', err.message));
  tcp.on('error', (err) => console.error('[TCP Error]', err.message));
});

console.log(`[WSS] Proxy running on port ${PORT} -> ${POOL_HOST}:${POOL_PORT}`);
