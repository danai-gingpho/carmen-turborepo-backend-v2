import { envConfig } from '@/libs/config.env';

const notify_host = envConfig.NOTIFICATION_SERVICE_HOST || 'localhost';
const notify_port = envConfig.NOTIFICATION_SERVICE_PORT || '5006';
export async function sendNotification(data: {
  title: string;
  message: string;
  type: string;
  category: string;
  userIds: string[];
}) {
  try {
    const response = await fetch(
      `http://${notify_host}:${notify_port}/api/notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      console.error('Failed to send notification:', response.statusText);
    } else {
      console.log('Notification sent successfully');
      return response.json();
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
