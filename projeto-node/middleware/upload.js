const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração detalhada do sistema de upload
class UploadSystem {
  constructor() {
    this.initializeDirectories();
  }

  // Inicializar todas as pastas necessárias
  initializeDirectories() {
    const baseUploadDir = path.join(__dirname, '../public/uploads');
    const directories = [
      'avatars',
      'posts',
      'temp'
    ];

    // Criar diretório base se não existir
    if (!fs.existsSync(baseUploadDir)) {
      fs.mkdirSync(baseUploadDir, { recursive: true });
      console.log('📁 Diretório de uploads criado:', baseUploadDir);
    }

    // Criar subdiretórios
    directories.forEach(dir => {
      const dirPath = path.join(baseUploadDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('📁 Subdiretório criado:', dirPath);
      }
    });
  }

  // Configuração avançada de storage para avatares
  createAvatarStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const avatarDir = path.join(__dirname, '../public/uploads/avatars');
        
        // Verificar se o diretório existe
        if (!fs.existsSync(avatarDir)) {
          fs.mkdirSync(avatarDir, { recursive: true });
        }
        
        cb(null, avatarDir);
      },
      filename: (req, file, cb) => {
        const userId = req.user.id;
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname).toLowerCase();
        
        // Validar extensões permitidas
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (!allowedExtensions.includes(extension)) {
          return cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.'), null);
        }
        
        // Gerar nome único para o arquivo
        const filename = `avatar_${userId}_${timestamp}_${randomString}${extension}`;
        console.log(`📸 Avatar sendo salvo: ${filename}`);
        
        cb(null, filename);
      }
    });
  }

  // Configuração avançada de storage para imagens de posts
  createPostImageStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const postDir = path.join(__dirname, '../public/uploads/posts');
        
        // Verificar se o diretório existe
        if (!fs.existsSync(postDir)) {
          fs.mkdirSync(postDir, { recursive: true });
        }
        
        cb(null, postDir);
      },
      filename: (req, file, cb) => {
        const userId = req.user.id;
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname).toLowerCase();
        
        // Validar extensões permitidas
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        if (!allowedExtensions.includes(extension)) {
          return cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF, WebP ou BMP.'), null);
        }
        
        // Gerar nome único para o arquivo
        const filename = `post_${userId}_${timestamp}_${randomString}${extension}`;
        console.log(`🖼️ Imagem de post sendo salva: ${filename}`);
        
        cb(null, filename);
      }
    });
  }

  // Filtro avançado de arquivos
  createFileFilter() {
    return (req, file, cb) => {
      // Verificar tipo MIME
      const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        console.log(`✅ Arquivo aceito: ${file.originalname} (${file.mimetype})`);
        cb(null, true);
      } else {
        console.log(`❌ Arquivo rejeitado: ${file.originalname} (${file.mimetype})`);
        cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}. Use apenas imagens.`), false);
      }
    };
  }

  // Configuração completa do multer para avatares
  getAvatarUpload() {
    return multer({
      storage: this.createAvatarStorage(),
      fileFilter: this.createFileFilter(),
      limits: {
        fileSize: 3 * 1024 * 1024, // 3MB
        files: 1 // Apenas 1 arquivo
      }
    });
  }

  // Configuração completa do multer para imagens de posts
  getPostImageUpload() {
    return multer({
      storage: this.createPostImageStorage(),
      fileFilter: this.createFileFilter(),
      limits: {
        fileSize: 8 * 1024 * 1024, // 8MB
        files: 5 // Máximo 5 arquivos
      }
    });
  }

  // Método para limpar arquivos temporários
  cleanupTempFiles() {
    const tempDir = path.join(__dirname, '../public/uploads/temp');
    if (fs.existsSync(tempDir)) {
      fs.readdir(tempDir, (err, files) => {
        if (err) throw err;
        
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        files.forEach(file => {
          const filePath = path.join(tempDir, file);
          fs.stat(filePath, (err, stat) => {
            if (err) return;
            
            if (now - stat.mtime.getTime() > maxAge) {
              fs.unlink(filePath, err => {
                if (err) console.error('Erro ao deletar arquivo temporário:', err);
                else console.log(`🧹 Arquivo temporário limpo: ${file}`);
              });
            }
          });
        });
      });
    }
  }
}

// Inicializar sistema de upload
const uploadSystem = new UploadSystem();

// Executar limpeza de arquivos temporários a cada hora
setInterval(() => {
  uploadSystem.cleanupTempFiles();
}, 60 * 60 * 1000);

// Exportar configurações prontas para uso
module.exports = {
  uploadAvatar: uploadSystem.getAvatarUpload(),
  uploadPostImage: uploadSystem.getPostImageUpload(),
  
  // Métodos utilitários adicionais
  deleteFile: (filePath) => {
    return new Promise((resolve, reject) => {
      const fullPath = path.join(__dirname, '../public', filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error('❌ Erro ao deletar arquivo:', err);
            reject(err);
          } else {
            console.log('✅ Arquivo deletado com sucesso:', filePath);
            resolve(true);
          }
        });
      } else {
        console.log('⚠️ Arquivo não encontrado para deleção:', filePath);
        resolve(false);
      }
    });
  },
  
  // Validar se arquivo existe
  fileExists: (filePath) => {
    const fullPath = path.join(__dirname, '../public', filePath);
    return fs.existsSync(fullPath);
  },
  
  // Obter estatísticas de uso de storage
  getStorageStats: () => {
    const uploadsDir = path.join(__dirname, '../public/uploads');
    
    const getFolderSize = (folderPath) => {
      let totalSize = 0;
      
      const calculateSize = (currentPath) => {
        const items = fs.readdirSync(currentPath);
        
        items.forEach(item => {
          const itemPath = path.join(currentPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            calculateSize(itemPath);
          } else {
            totalSize += stat.size;
          }
        });
      };
      
      if (fs.existsSync(folderPath)) {
        calculateSize(folderPath);
      }
      
      return totalSize;
    };
    
    const totalSize = getFolderSize(uploadsDir);
    const avatarSize = getFolderSize(path.join(uploadsDir, 'avatars'));
    const postSize = getFolderSize(path.join(uploadsDir, 'posts'));
    
    return {
      total: totalSize,
      avatars: avatarSize,
      posts: postSize,
      totalMB: (totalSize / (1024 * 1024)).toFixed(2),
      avatarsMB: (avatarSize / (1024 * 1024)).toFixed(2),
      postsMB: (postSize / (1024 * 1024)).toFixed(2)
    };
  }
};