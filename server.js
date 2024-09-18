const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { PeerServer } = require('peer');
const cors = require('cors');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurer la confiance aux proxys
app.set('trust proxy', 1);

// Utiliser la compression pour optimiser les performances
app.use(compression());

// Middleware pour traiter les requêtes JSON et les données URL-encodées
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurer CORS
app.use(cors({
    origin: ['*'], // Origines autorisées
    credentials: true,
    optionsSuccessStatus: 200,
}));

// Configuration du serveur PeerJS
const peerServer = PeerServer({ port: 9000, path: '/peer' });

// Gérer les connexions Socket.io
io.on('connection', (socket) => {
    console.log('Un nouvel utilisateur est connecté:', socket.id);

    socket.on('offer', (data) => {
        console.log(`Offre reçue de ${socket.id} pour ${data.to}`);
        socket.to(data.to).emit('offer', { from: socket.id, sdp: data.sdp });
    });

    socket.on('answer', (data) => {
        console.log(`Réponse reçue de ${socket.id} pour ${data.to}`);
        socket.to(data.to).emit('answer', { from: socket.id, sdp: data.sdp });
    });

    socket.on('ice-candidate', (data) => {
        console.log(`Candidat ICE reçu de ${socket.id} pour ${data.to}`);
        socket.to(data.to).emit('ice-candidate', { candidate: data.candidate });
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté:', socket.id);
    });

    // Gérer les erreurs
    socket.on('error', (error) => {
        console.error('Erreur Socket.IO:', error);
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Quelque chose s\'est mal passé!');
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur de signalisation en cours d'exécution sur le port ${PORT}`);
});
