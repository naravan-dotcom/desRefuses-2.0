export const MAX_UPLOAD_SIZE = 1024 * 1024;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const IMAGE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");
