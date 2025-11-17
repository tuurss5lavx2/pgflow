const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ✅ CONEXÃO MONGODB PRIMEIRO
const connectDB = require('./config/database');
connectDB();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();

// ✅ MIDDLEWARES
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ ROTAS DA API
app.use('/api/auth', (req, res, next) => {
  console.log(`📨 Rota auth acessada: ${req.method} ${req.url}`);
  next();
}, authRoutes);

app.use('/api/posts', (req, res, next) => {
  console.log(`📨 Rota posts acessada: ${req.method} ${req.url}`);
  next();
}, postRoutes);

// ✅ ROTAS DO FRONTEND
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ✅ ROTA DE FALLBACK
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});