export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
  ],
  UPLOAD_PATH: 'public/uploads',
  MAX_FILES_PER_REQUEST: 10,
}

export const FILE_ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB',
  INVALID_FILE_TYPE: 'File type is not allowed',
  TOO_MANY_FILES: 'Too many files uploaded at once',
  UPLOAD_FAILED: 'File upload failed',
  FILE_NOT_FOUND: 'File not found',
  DELETE_FAILED: 'File deletion failed',
  ACCESS_DENIED: 'Access denied to this file',
}
