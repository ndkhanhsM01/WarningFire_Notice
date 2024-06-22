const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const messageTitle = "MESSAGE";
const warningTitle = "WARNING";

let clients = [];
let warningCount = 0;

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

        res.send({
            type: messageTitle,
            message: 'Registered for events'
        });
        
        console.log("New client was connected" + "(" + clientId + ")");
    } else {
        res.status(404).send('Client not connected');
    }
});

// API 2: Gửi message tới các user đã đăng ký sự kiện
app.post('/notify', (req, res) => {
    const messageReq = req.body.message;
    if (!messageReq) {
        return res.status(400).send('Message is required');
    }

    clients.forEach(client => {
        if (client.isRegistered) {
            client.ws.send(JSON.stringify({
                type: warningTitle,
                message: '<Sensor warning> ' + messageReq
            }));
            console.log("send message to: " + client.id);
        }
    });

    warningCount++;
    console.log("Detect warning fire to clients!" + "(" + warningCount +" times)");
    res.send('Message sent to registered clients');
});

// Thiết lập WebSocket connection
wss.on('connection', (ws) => {
    const clientId = generateUniqueId();
    clients.push({ id: clientId, ws, isRegistered: false });

    ws.on('close', () => {
        clients = clients.filter(client => client.ws !== ws);
    });

    ws.send(JSON.stringify({ type: messageTitle, message: 'Connected', clientId }));
});

// Hàm để tạo ID duy nhất
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9) + "-" + Date.now();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
