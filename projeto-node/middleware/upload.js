const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configuração temporária - storage em memória
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Função para upload manual para o Cloudinary
const uploadToCloudinary = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const publicId = `avatar-${userId}-${timestamp}`;
    
    cloudinary.uploader.upload_stream(
      {
        folder: 'pgflow-avatars',
        public_id: publicId,
        transformation: [
          { width: 300, height: 300, crop: 'limit', quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };