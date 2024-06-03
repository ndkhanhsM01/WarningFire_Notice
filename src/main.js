const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

// Middleware để parse JSON body
app.use(express.json());

// API 1: Đăng ký sự kiện cho user
app.post('/register', (req, res) => {
    const clientId = req.body.clientId;
    if (!clientId) {
        return res.status(400).send('Client ID is required');
    }

    const wsClient = clients.find(client => client.id === clientId);
    if (wsClient) {
        wsClient.isRegistered = true;
        res.send('Registered for events');
    } else {
        res.status(404).send('Client not connected');
    }
});

// API 2: Gửi message tới các user đã đăng ký sự kiện
app.post('/notify', (req, res) => {
    const message = req.body.message;
    if (!message) {
        return res.status(400).send('Message is required');
    }

    clients.forEach(client => {
        if (client.isRegistered) {
            client.ws.send(JSON.stringify({ message }));
        }
    });

    res.send('Message sent to registered clients');
});

// Thiết lập WebSocket connection
wss.on('connection', (ws) => {
    const clientId = generateUniqueId();
    clients.push({ id: clientId, ws, isRegistered: false });

    ws.on('close', () => {
        clients = clients.filter(client => client.ws !== ws);
    });

    ws.send(JSON.stringify({ message: 'Connected', clientId }));
});

// Hàm để tạo ID duy nhất
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
