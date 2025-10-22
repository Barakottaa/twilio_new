// Media message handling system for free cloud hosting

export interface MediaMessage {
  id: string;
  conversationId: string;
  senderType: 'agent' | 'customer';
  senderId: string;
  timestamp: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string;
  mediaContentType: string;
  mediaSize?: number;
  thumbnailUrl?: string;
  caption?: string;
  fileName?: string;
}

export interface MediaStorageConfig {
  // Storage strategy
  storageType: 'twilio' | 'cloudinary' | 'supabase' | 's3';
  
  // Media processing
  generateThumbnails: boolean;
  compressImages: boolean;
  maxFileSize: number; // in bytes
  
  // Retention policy
  keepOriginalUrls: boolean;
  archiveAfterDays: number;
  
  // Free tier optimizations
  useExternalStorage: boolean;
  compressForStorage: boolean;
}

export const DEFAULT_MEDIA_CONFIG: MediaStorageConfig = {
  storageType: 'twilio', // Use Twilio's temporary URLs (free)
  generateThumbnails: true,
  compressImages: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  keepOriginalUrls: false, // Don't store URLs permanently
  archiveAfterDays: 30,
  useExternalStorage: false, // Use free external storage
  compressForStorage: true
};

// Process incoming media message from Twilio webhook
export function processMediaMessage(webhookParams: any): MediaMessage[] {
  const mediaMessages: MediaMessage[] = [];
  const numMedia = parseInt(webhookParams.NumMedia || '0', 10);
  
  if (numMedia > 0) {
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = webhookParams[`MediaUrl${i}`];
      const contentType = webhookParams[`MediaContentType${i}`];
      
      if (mediaUrl && contentType) {
        const mediaType = getMediaTypeFromContentType(contentType);
        
        mediaMessages.push({
          id: `${webhookParams.MessageSid}_media_${i}`,
          conversationId: webhookParams.ConversationSid,
          senderType: webhookParams.Author?.startsWith('agent-') ? 'agent' : 'customer',
          senderId: webhookParams.Author || 'customer',
          timestamp: webhookParams.DateCreated || new Date().toISOString(),
          mediaType,
          mediaUrl,
          mediaContentType: contentType,
          caption: webhookParams.Body || undefined,
          fileName: extractFileNameFromUrl(mediaUrl)
        });
      }
    }
  }
  
  return mediaMessages;
}

// Determine media type from MIME type
function getMediaTypeFromContentType(contentType: string): 'image' | 'video' | 'audio' | 'document' {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Extract filename from URL
function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'media';
    return filename;
  } catch {
    return 'media';
  }
}

// Generate thumbnail URL for images/videos
export function generateThumbnailUrl(mediaUrl: string, mediaType: string): string {
  if (mediaType === 'image') {
    // For images, we can use the same URL or generate a smaller version
    return mediaUrl;
  }
  
  if (mediaType === 'video') {
    // For videos, we'd need a service that generates thumbnails
    // This is a placeholder - you'd implement actual thumbnail generation
    return `https://via.placeholder.com/300x200?text=Video+Thumbnail`;
  }
  
  return '';
}

// Calculate storage usage for media messages
export function calculateMediaStorageUsage(mediaMessages: MediaMessage[]): {
  totalFiles: number;
  estimatedSize: number;
  byType: Record<string, { count: number; size: number }>;
} {
  const byType: Record<string, { count: number; size: number }> = {
    image: { count: 0, size: 0 },
    video: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
    document: { count: 0, size: 0 }
  };
  
  let totalSize = 0;
  
  mediaMessages.forEach(media => {
    byType[media.mediaType].count++;
    
    // Estimate size based on media type
    const estimatedSize = estimateMediaSize(media.mediaType, media.mediaSize);
    byType[media.mediaType].size += estimatedSize;
    totalSize += estimatedSize;
  });
  
  return {
    totalFiles: mediaMessages.length,
    estimatedSize: totalSize,
    byType
  };
}

// Estimate media size based on type
function estimateMediaSize(mediaType: string, actualSize?: number): number {
  if (actualSize) return actualSize;
  
  // Default estimates for free tier planning
  switch (mediaType) {
    case 'image': return 500 * 1024; // 500KB average
    case 'video': return 5 * 1024 * 1024; // 5MB average
    case 'audio': return 1 * 1024 * 1024; // 1MB average
    case 'document': return 2 * 1024 * 1024; // 2MB average
    default: return 1 * 1024 * 1024; // 1MB default
  }
}

// Get storage recommendations for media
export function getMediaStorageRecommendations(
  totalMediaSize: number,
  freeLimit: number
): string[] {
  const recommendations: string[] = [];
  const usagePercent = (totalMediaSize / freeLimit) * 100;
  
  if (usagePercent > 80) {
    recommendations.push('🚨 High media storage usage! Consider external storage.');
    recommendations.push('💾 Use Cloudinary or Supabase Storage for media files.');
  }
  
  if (usagePercent > 60) {
    recommendations.push('⚠️ Enable image compression to reduce storage.');
    recommendations.push('🗄️ Archive old media files after 30 days.');
  }
  
  if (usagePercent > 40) {
    recommendations.push('📊 Monitor media storage usage regularly.');
    recommendations.push('🖼️ Generate thumbnails instead of storing full images.');
  }
  
  if (usagePercent < 20) {
    recommendations.push('✅ Media storage usage is healthy!');
  }
  
  return recommendations;
}
