import { NextRequest, NextResponse } from 'next/server';
import { calculateStorageUsage, getStorageRecommendations } from '@/lib/storage-optimization';
import { getStorageStatus } from '@/lib/message-archiver';

// API endpoint to check storage usage and get optimization recommendations
export async function GET(req: NextRequest) {
  try {
    // This would integrate with your actual database
    // For now, showing the structure
    
    // Get current storage usage (mock data for demonstration)
    const mockUsage = {
      totalMessages: 50000,
      totalConversations: 1000,
      totalContacts: 500,
      estimatedSize: 10 * 1024 * 1024, // 10MB
      freeLimit: 500 * 1024 * 1024 // 500MB (Supabase free tier)
    };
    
    // Calculate storage status
    const storageStatus = getStorageStatus(
      mockUsage.estimatedSize,
      mockUsage.freeLimit,
      mockUsage.totalMessages
    );
    
    // Get recommendations
    const recommendations = getStorageRecommendations(
      mockUsage.estimatedSize,
      mockUsage.freeLimit
    );
    
    // Calculate potential savings
    const potentialSavings = {
      withArchiving: {
        messagesToArchive: Math.max(0, mockUsage.totalMessages - 10000), // Keep last 10k messages
        estimatedSavings: Math.max(0, mockUsage.totalMessages - 10000) * 200, // 200 bytes per message
        newUsage: mockUsage.estimatedSize - (Math.max(0, mockUsage.totalMessages - 10000) * 200)
      },
      withCompression: {
        compressionRatio: 0.6, // 40% size reduction
        estimatedSavings: mockUsage.estimatedSize * 0.4,
        newUsage: mockUsage.estimatedSize * 0.6
      }
    };
    
    return NextResponse.json({
      success: true,
      storage: {
        current: {
          totalMessages: mockUsage.totalMessages,
          totalConversations: mockUsage.totalConversations,
          totalContacts: mockUsage.totalContacts,
          estimatedSize: mockUsage.estimatedSize,
          sizeFormatted: formatBytes(mockUsage.estimatedSize)
        },
        limits: {
          freeLimit: mockUsage.freeLimit,
          freeLimitFormatted: formatBytes(mockUsage.freeLimit),
          usagePercent: storageStatus.usagePercent
        },
        status: storageStatus.status,
        recommendations: storageStatus.recommendations,
        potentialSavings: {
          archiving: {
            ...potentialSavings.withArchiving,
            estimatedSavingsFormatted: formatBytes(potentialSavings.withArchiving.estimatedSavings),
            newUsageFormatted: formatBytes(potentialSavings.withArchiving.newUsage)
          },
          compression: {
            ...potentialSavings.withCompression,
            estimatedSavingsFormatted: formatBytes(potentialSavings.withCompression.estimatedSavings),
            newUsageFormatted: formatBytes(potentialSavings.withCompression.newUsage)
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting storage status:', error);
    return NextResponse.json(
      { error: 'Failed to get storage status' },
      { status: 500 }
    );
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
