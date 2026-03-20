import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './documents.types';

// Use memory storage — files are passed to storage provider as buffers
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`UNSUPPORTED_MIME_TYPE:${file.mimetype}`));
    }
  },
});

export const uploadSingle = upload.single('file');

// Middleware wrapper that converts multer errors to proper HTTP responses
export function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadSingle(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 50MB.', code: 'FILE_TOO_LARGE' });
      }
      return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
    }

    if (err instanceof Error && err.message.startsWith('UNSUPPORTED_MIME_TYPE')) {
      return res.status(415).json({ error: 'Unsupported file type.', code: 'UNSUPPORTED_MEDIA_TYPE' });
    }

    next(err);
  });
}
