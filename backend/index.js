const express = require('express');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount central router
try {
  const routes = require('./app');
  if (routes) app.use('/api', routes);
} catch (err) {
  // no central router — ignore
}

// Test SQL connection
try {
  const { pool } = require('./config/db');
  pool.getConnection()
    .then(() => console.log('SQL connected'))
    .catch(err => console.log('SQL connection error:', err.message));
} catch (err) {
  // no db module — ignore
}

const PORT = parseInt(process.env.PORT, 10) || 4000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

module.exports = app;