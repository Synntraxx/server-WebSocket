const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const server = https.createServer({
    key: fs.readFileSync('/etc/ssl/private/selfsigned.key'),
    cert: fs.readFileSync('/etc/ssl/private/selfsigned.crt')
});


// Créer un serveur WebSocket sécurisé
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on('connection', (ws) => {
    console.log('Nouvelle connexion sécurisée établie.');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'identify') {
            clients[data.userId] = ws;
            console.log(`Utilisateur identifié : ${data.userId}`);
        }

        if (data.type === 'writing') {
            const targetUserId = data.targetUserId;
            if (clients[targetUserId]) {
                clients[targetUserId].send(
                    JSON.stringify({
                        type: 'writing',
                        senderId: data.userId,
                    })
                );
                console.log(
                    `Notification d'écriture envoyée à ${targetUserId} par ${data.userId}`
                );
            }
        }
    });

    ws.on('close', () => {
        for (const userId in clients) {
            if (clients[userId] === ws) {
                delete clients[userId];
                console.log(`Utilisateur déconnecté : ${userId}`);
                break;
            }
        }
    });
});

// Le serveur HTTPS écoute sur le port 443
server.listen(443, () => {
    console.log('Serveur WebSocket sécurisé en écoute sur le port 443.');
});
