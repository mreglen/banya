const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|ogg|mkv|m4v)(\?.*)?$/i;

export const isVideoUrl = (url) => {
  if (!url) return false;
  return VIDEO_URL_PATTERN.test(url) || url.includes('/uploads/videos/');
};

export const isVideoFile = (file) => file?.type?.startsWith('video/');
