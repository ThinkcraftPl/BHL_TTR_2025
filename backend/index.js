const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const WebSocket = require('ws');
const setupWss = require('./base_station');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // adjust as needed for your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
})); // enable CORS for all origins (configure options as needed)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health route
app.get('/', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/bins', require('./bins'));
app.use('/api/bin_types', require('./bin_types'));
// app.use('/api/base_station', require('./base_station'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
initDatabase();

if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    const wss = new WebSocket.Server({ server, path: '/ws/base_station' });
    setupWss(wss);
}

module.exports = app;