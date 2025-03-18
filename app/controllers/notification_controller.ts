import type { HttpContext } from "@adonisjs/core/http";
import Subscription from "#models/subscription";
import webPush, {PushSubscription} from 'web-push'
import env from "#start/env";
import UserChannel from "#models/user_channel";
import User from "#models/user";

// Configure les clés VAPID pour web-push
webPush.setVapidDetails(
  `mailto:${env.get('VAPID_EMAIL')}`,
  env.get('VAPID_PUBLIC_KEY'),
  env.get('VAPID_PRIVATE_KEY')
);

export default class NotificationController {
  async subscribe({ auth, request, response }: HttpContext) {
    const authUser = auth.getUserOrFail();
    const { endpoint, keys } = request.only(['endpoint', 'keys'])

    // Vérifie si l'abonnement existe déjà
    const existingSubscription = await Subscription.findBy('endpoint', endpoint)
    if (existingSubscription) {
      return response.ok({ message: 'Cet abonnement existe déjà' })
    }

    // Crée un nouvel abonnement
    const subscription = await Subscription.create({
      endpoint,
      keys: JSON.stringify(keys),
      userId: authUser.id
    })

    return response.created({ message: 'Abonnement enregistré !', subscription })
  }

  async sendToUsersChannel(channelId: number, author: User, message: string) {
    try {
      // Récupérer tous les utilisateurs abonnés au canal
      const userChannels = await UserChannel.query()
        .where('channelId', channelId)
        .whereNot('userId', author.id) // Exclure l'utilisateur qui envoie le message
        .preload('user');

      if (!userChannels.length) return console.log('Aucun utilisateur abonné à ce canal.');

      // Définir les URLs
      const channelUrl = `${env.get('FRONTEND_URL')}/channel/${channelId}`;
      const iconUrl = `${env.get('FRONTEND_URL')}/icons/icon-192x192.png`;

      // Définir le payload de la notification
      const notificationPayload = {
        notification: {
          title: author.name,
          body: message,
          icon: iconUrl,
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: Date.now(),
            url: channelUrl, // L'URL du channel
            onActionClick: {
              default: { operation: "openWindow", url: channelUrl },
            },
          },
        },
      };

      // Envoi de notification à chaque utilisateur du canal
      for (const { user } of userChannels) {
        const subscriptions = await Subscription.query().where('userId', user.id);
        if (!subscriptions.length) continue;

        for (const { keys, endpoint } of subscriptions) {
          const pushSubscription: PushSubscription = {
            endpoint,
            keys: typeof keys === 'string' ? JSON.parse(keys) : keys,
          };

          try {
            await webPush.sendNotification(pushSubscription, JSON.stringify(notificationPayload));
            console.log('Notification envoyée à', endpoint);
          } catch (err) {
            console.error('Erreur lors de l\'envoi de la notification à l\'endpoint:', endpoint, err);
          }
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  }
}
