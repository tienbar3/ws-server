// server.js
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Echo lại hoặc xử lý logic
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => console.log('Client disconnected'));
});

console.log(`WS Server running on port ${PORT}`);
