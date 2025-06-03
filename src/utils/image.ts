export function transformImage(url: string, width = 500, quality = 80): string {
  try {
    const cloudinaryRegex = /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/([^/].*)/;
    if (cloudinaryRegex.test(url)) {
      return url.replace('/upload/', `/upload/w_${width},q_${quality}/`);
    }
    return url; // not cloudinary
  } catch {
    return url;
  }
} 