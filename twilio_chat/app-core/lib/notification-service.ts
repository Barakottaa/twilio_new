// Notification service for Chrome notifications
export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkPermission(): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.log('❌ Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  public async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    console.log('🔔 showNotification called:', { title, options, permission: this.permission });
    
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return;
    }

    if (this.permission !== 'granted') {
      console.log('❌ Notification permission not granted. Current permission:', this.permission);
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click to focus window
      notification.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
        }
        notification.close();
      };

      console.log('✅ Notification shown:', title);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  public async showNewConversationNotification(conversationTitle: string, customerPhone?: string): Promise<void> {
    const title = 'New Conversation';
    const body = customerPhone 
      ? `New message from ${conversationTitle} (${customerPhone})`
      : `New message from ${conversationTitle}`;

    await this.showNotification(title, {
      body,
      tag: 'new-conversation', // Prevents duplicate notifications
      data: {
        type: 'new-conversation',
        conversationTitle,
        customerPhone
      }
    });
  }

  public async showNewMessageNotification(conversationTitle: string, messagePreview: string): Promise<void> {
    console.log('🔔 showNewMessageNotification called:', { conversationTitle, messagePreview });
    
    const title = `New message from ${conversationTitle}`;
    const body = messagePreview.length > 50 
      ? messagePreview.substring(0, 50) + '...'
      : messagePreview;

    console.log('🔔 Showing notification:', { title, body });
    await this.showNotification(title, {
      body,
      tag: `message-${conversationTitle}`, // Prevents duplicate notifications for same conversation
      data: {
        type: 'new-message',
        conversationTitle,
        messagePreview
      }
    });
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
