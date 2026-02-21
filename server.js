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

  let buffer = '';

  // Client → Pool
  ws.on('message', (data) => {
    try {
      const str = data.toString();
      console.log('[WS→TCP]', str);
      // Stratum cần newline ở cuối mỗi message
      if (tcp.writable) tcp.write(str + (str.endsWith('\n') ? '' : '\n'));
    } catch(e) {
      console.error('[WS→TCP Error]', e.message);
    }
  });

  // Pool → Client
  tcp.on('data', (data) => {
    try {
      buffer += data.toString();
      // Tách từng dòng JSON riêng
      const lines = buffer.split('\n');
      buffer = lines.pop(); // giữ phần chưa complete
      
      lines.forEach(line => {
        if (line.trim() && ws.readyState === WebSocket.OPEN) {
          console.log('[TCP→WS]', line);
          ws.send(line);
        }
      });
    } catch(e) {
      console.error('[TCP→WS Error]', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[TCP] Pool socket closed for ${POOL_HOST} (${POOL_PORT})`);
    tcp.destroy();
  });

  tcp.on('close', () => ws.close());

  ws.on('error', (err) => console.error('[WS Error]', err.message));
  tcp.on('error', (err) => console.error('[TCP Error]', err.message));
});

console.log(`[WSS] Proxy running on port ${PORT} -> ${POOL_HOST}:${POOL_PORT}`);
