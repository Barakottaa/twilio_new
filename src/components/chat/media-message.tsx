import React from 'react';
import { Image, Video, File, Music, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MediaMessageProps {
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string;
  mediaContentType: string;
  fileName?: string;
  caption?: string;
  timestamp: string;
  sender: 'agent' | 'customer';
}

export function MediaMessage({ 
  mediaType, 
  mediaUrl, 
  mediaContentType, 
  fileName, 
  caption, 
  timestamp, 
  sender 
}: MediaMessageProps) {
  const isAgent = sender === 'agent';
  
  const handleDownload = () => {
    // Create a temporary link to download the media
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName || `media_${Date.now()}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  
  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'document': return <File className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };
  
  const renderMediaContent = () => {
    switch (mediaType) {
      case 'image':
        return (
          <div className="relative">
            <img 
              src={mediaUrl} 
              alt={caption || 'Image'} 
              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
                    <div class="text-center">
                      <Image class="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p class="text-sm text-gray-500">Image unavailable</p>
                    </div>
                  </div>
                `;
              }}
            />
            {caption && (
              <p className="text-sm text-gray-600 mt-2">{caption}</p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="relative">
            <video 
              controls 
              className="max-w-full h-auto rounded-lg"
              preload="metadata"
            >
              <source src={mediaUrl} type={mediaContentType} />
              Your browser does not support the video tag.
            </video>
            {caption && (
              <p className="text-sm text-gray-600 mt-2">{caption}</p>
            )}
          </div>
        );
        
      case 'audio':
        return (
          <div className="space-y-2">
            <audio controls className="w-full">
              <source src={mediaUrl} type={mediaContentType} />
              Your browser does not support the audio element.
            </audio>
            {caption && (
              <p className="text-sm text-gray-600">{caption}</p>
            )}
          </div>
        );
        
      case 'document':
        const isPDF = mediaContentType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
        const displayName = fileName || (isPDF ? 'PDF Document' : 'Document');
        
        return (
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              {getMediaIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">
                  {mediaContentType}
                </p>
                {caption && caption !== `Document: ${fileName}` && (
                  <p className="text-sm text-gray-600 mt-1">{caption}</p>
                )}
                {!caption && !fileName && (
                  <p className="text-sm text-gray-600 mt-1">Document received</p>
                )}
              </div>
              <div className="flex space-x-2">
                {isPDF && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(mediaUrl, '_blank')}
                    className="flex items-center space-x-1"
                  >
                    <File className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </Card>
        );
        
      default:
        return (
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              {getMediaIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium">Unknown media type</p>
                <p className="text-xs text-gray-500">{mediaContentType}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        );
    }
  };
  
  return (
    <div className={`flex items-end gap-2 ${isAgent ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-lg px-3 py-2 max-w-md relative animate-in fade-in zoom-in-95 ${
          isAgent 
            ? "bg-primary text-primary-foreground" 
            : "bg-card shadow-sm"
        }`}
      >
        {renderMediaContent()}
        <span className={`text-xs text-right block mt-1 ${
          isAgent ? "opacity-60" : "text-gray-500"
        }`}>
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
