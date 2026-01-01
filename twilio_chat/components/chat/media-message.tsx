import React, { useState, useRef, useEffect } from 'react';
import { Image, Video, File, Music, Download, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MediaMessageProps {
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string;
  mediaContentType: string;
  fileName?: string;
}

// Custom Audio Player Component
function CustomAudioPlayer({ mediaUrl, mediaContentType, fileName }: { mediaUrl: string; mediaContentType: string; fileName?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-3">
      <audio ref={audioRef} preload="metadata">
        <source src={mediaUrl} type={mediaContentType} />
        Your browser does not support the audio element.
      </audio>

      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Music className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileName || 'Sound Record'}
            </p>
            <p className="text-xs text-gray-500">
              {mediaContentType}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = mediaUrl;
                link.download = fileName || `audio_${Date.now()}`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* Custom Controls */}
        <div className="space-y-2">
          {/* Progress Bar */}
          <div
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer hover:h-3 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Time Display and Controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatTime(currentTime)}
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="h-8 w-8 p-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="h-8 w-8 p-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <span className="text-xs text-gray-500">
              {isLoading ? 'Loading...' : formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MediaMessage({
  mediaType,
  mediaUrl,
  mediaContentType,
  fileName
}: MediaMessageProps) {

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
              alt={'Image'}
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
          </div>
        );

      case 'audio':
        return (
          <div>
            <CustomAudioPlayer
              mediaUrl={mediaUrl}
              mediaContentType={mediaContentType}
              fileName={fileName}
            />
          </div>
        );

      case 'document':
        const isPDF = mediaContentType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
        const displayName = fileName || (isPDF ? 'PDF Document' : 'Document');

        return (
          <div className="p-2 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center space-x-3">
              {getMediaIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">
                  {mediaContentType}
                </p>
              </div>
              <div className="flex space-x-1">
                {isPDF && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(mediaUrl, '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <File className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-2 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center space-x-3">
              {getMediaIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium">Unknown media type</p>
                <p className="text-xs text-gray-500">{mediaContentType}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderMediaContent()}
    </div>
  );
}
