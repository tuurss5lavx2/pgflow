# 🚀 PGFlow - CRUD Social com Autenticação

**PGFlow** é uma aplicação full-stack que demonstra um **sistema básico de rede social** com autenticação JWT, CRUD de posts, comentários e sistema de interações.

![PGFlow Demo](https://via.placeholder.com/1200x400/10b981/ffffff?text=PGFlow+-+CRUD+Social+Moderno)

---

## 🎯 O que é

Uma aplicação que demonstra:
- Autenticação JWT com proteção de rotas.
- CRUD completo para posts e comentários.
- Sistema de likes em posts e comentários (com feedback sonoro).
- Upload de avatar via Cloudinary.
- Frontend responsivo com Bootstrap 5.

---

## 🔐 Funcionalidades principais

### Sistema de Autenticação
- Registro e login com JWT
- Senhas criptografadas com bcrypt
- Proteção de rotas privadas
- Tokens com expiração automática

### CRUD de Posts
- Criar, ler, editar e excluir posts
- Dashboard pessoal
- Feed público da comunidade
- Validações de autorização

### Interações
- Likes em posts e comentários
- Feedback sonoro ao curtir
- Comentários simples
- Contadores em tempo real (frontend)

### Extras
- Upload de avatar com Cloudinary
- Design responsivo com Bootstrap 5
- API RESTful organizada
- Deploy em produção (p.ex. Render)

---

## 🛠️ Stack real

### 🔧 Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens)
![bcrypt](https://img.shields.io/badge/bcrypt-005C84?style=for-the-badge)

### 🎨 Frontend
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

### ☁️ Serviços & Deploy
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## 🎓 Objetivo do projeto

Demonstrar habilidades em:
- Desenvolvimento Full-Stack com arquitetura organizada (MVC).
- Autenticação e autorização com JWT.
- CRUD completo com validações no frontend e backend.
- Integração com serviços externos (Cloudinary).
- Preparação para deploy em produção (MongoDB Atlas, Render).

---

## 💡 Diferenciais

### 🔊 Sistema de Som Interativo
Feedback sonoro ao curtir para melhorar a experiência do usuário.

```javascript
// Feedback sonoro único ao curtir (exemplo)
function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // frequência em Hz
  gain.gain.setValueAtTime(0.05, audioContext.currentTime); // volume
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.06); // duração curta
}
```

Design moderno, animações suaves, totalmente responsivo e foco em performance (queries MongoDB eficientes, lazy loading de assets).

---

## 🚀 Como Executar

Pré-requisitos:
- Node.js 16+
- MongoDB (Atlas ou local)
- Conta no Cloudinary (opcional para upload de avatars)

Passos:

```bash
# Clone o repositório
git clone https://github.com/PabloG-7/pgflow.git
cd pgflow

# Instale as dependências
npm install

# Copie o .env de exemplo e edite
cp .env.example .env
# Edite o .env com suas configurações

# Execute em desenvolvimento
npm run dev
```

---

## 📁 Estrutura do Projeto

```
projeto-node/
├── config/
│   ├── database.js          # Conexão MongoDB
│   └── cloudinary.js        # Config Cloudinary
├── controllers/
│   ├── authController.js    # Lógica de autenticação
│   ├── postController.js    # CRUD de posts
│   └── commentController.js # Gestão de comentários
├── models/
│   ├── User.js              # Schema de usuário
│   ├── Post.js              # Schema de post
│   └── Comment.js           # Schema de comentário
├── middleware/
│   ├── auth.js              # Middleware de autenticação
│   └── upload.js            # Upload de arquivos
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── posts.js             # Rotas de posts
│   └── comments.js          # Rotas de comentários
├── public/
│   ├── *.html               # Páginas frontend
│   ├── css/
│   │   └── style.css        # Estilos customizados
│   └── js/
│       ├── auth.js          # Autenticação frontend
│       ├── dashboard.js     # Lógica do dashboard
│       ├── posts.js         # Gestão de posts
│       └── profile.js       # Perfil do usuário
└── server.js                # Entry point da aplicação
```

---

## 🔌 API Endpoints

Autenticação
```
POST   /api/auth/register        # Registrar usuário
POST   /api/auth/login           # Fazer login
GET    /api/auth/profile         # Buscar perfil (privado)
PUT    /api/auth/profile         # Atualizar perfil (privado)
POST   /api/auth/avatar          # Upload de avatar (privado)
```

Posts
```
GET    /api/posts                # Listar todos os posts
POST   /api/posts                # Criar novo post (privado)
GET    /api/posts/:id            # Buscar post específico
PUT    /api/posts/:id            # Atualizar post (privado/autorizado)
DELETE /api/posts/:id            # Excluir post (privado/autorizado)
POST   /api/posts/:id/like       # Curtir/descurtir post (privado)
GET    /api/posts/user           # Posts do usuário logado (privado)
```

Comentários
```
POST   /api/comments                     # Adicionar comentário (privado)
GET    /api/comments/post/:postId        # Comentários de um post
DELETE /api/comments/:id                 # Excluir comentário (privado/autorizado)
POST   /api/comments/:id/like            # Curtir comentário (privado)
```

---

## 🎯 Próximos Passos Possíveis

Melhorias técnicas:
- Paginação e infinite scroll
- Cache com Redis
- Testes unitários e e2e
- Rate limiting e proteção adicional
- Documentação Swagger/OpenAPI

Features adicionais:
- Sistema de seguidores
- Notificações em tempo real (WebSocket)
- Mensagens privadas
- Upload de múltiplas imagens
- Busca por posts/usuários

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Fluxo sugerido:
1. Fork o projeto
2. Crie uma branch: git checkout -b feature/nova-feature
3. Commit: git commit -m "Add nova feature"
4. Push: git push origin feature/nova-feature
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

---

## 👨‍💻 Autor

Pablo Gomes

- GitHub: https://github.com/PabloG-7
- LinkedIn: https://www.linkedin.com/in/pablogomess/
- Instagram: https://www.instagram.com/pablog.dev/

---

## 🎉 Agradecimentos

- MongoDB - Banco de dados NoSQL
- Cloudinary - Gestão de mídia
- Render - Plataforma de deploy
- Bootstrap - Framework CSS

<div align="center">
  <strong>PGFlow</strong> — Um projeto full-stack para demonstrar habilidades em desenvolvimento web moderno! 🚀
</div>
