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

// ✅ MIDDLEWARES - CORS ajustado para produção
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://userflow-backend.onrender.com',
    'https://userflow-frontend.onrender.com' // se tiver frontend separado
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ ROTAS DA API (com logs apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/auth', (req, res, next) => {
    console.log(`📨 Rota auth acessada: ${req.method} ${req.url}`);
    next();
  });
}

app.use('/api/auth', authRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/posts', (req, res, next) => {
    console.log(`📨 Rota posts acessada: ${req.method} ${req.url}`);
    next();
  });
}

app.use('/api/posts', postRoutes);

// ✅ ROTAS DO FRONTEND
// ✅ ROTAS DO FRONTEND (ATUALIZADAS)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// ✅ ROTA DE FALLBACK (ATUALIZADA)
app.use('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ message: 'Rota não encontrada' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});