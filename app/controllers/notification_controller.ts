import type { HttpContext } from "@adonisjs/core/http";
import Subscription from "#models/subscription";
import webPush, {PushSubscription} from 'web-push'
import env from "#start/env";
import UserChannel from "#models/user_channel";
import User from "#models/user";

export default class NotificationController {
  async subscribe({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();

    const { endpoint, keys } = request.only(['endpoint', 'keys'])

    // Vérifie si l'abonnement existe déjà
    const existingSubscription = await Subscription.findBy('endpoint', endpoint)
    if (existingSubscription) {
      return response.ok({ message: 'Cet abonnement existe déjà' })
    }

    // Crée un nouvel abonnement
    const subscription = await Subscription.create({
      endpoint,
      keys: JSON.stringify(keys), // Stocke sous forme de JSON
      userId: user.id
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

      // S'il n'y a pas d'utilisateurs abonnés, ne rien faire
      if (userChannels.length === 0) {
        console.log('Aucun utilisateur abonné à ce canal.');
        return;
      }

      // Configure les clés VAPID pour web-push
      webPush.setVapidDetails(
        `mailto:${env.get('VAPID_EMAIL')}`,
        env.get('VAPID_PUBLIC_KEY'),
        env.get('VAPID_PRIVATE_KEY')
      );

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
            url: channelUrl // L'URL du channel
          },
          actions: [
            {
              action: 'explore',
              title: 'Allez sur le chanel',
              url: channelUrl
            }
          ]
        },
      };

      // Envoi de notification à chaque utilisateur du canal
      for (const userChannel of userChannels) {
        const user = userChannel.user;

        // Récupérer les abonnements de l'utilisateur
        const subscriptions = await Subscription.query()
          .where('userId', user.id); // Trouver tous les abonnements pour cet utilisateur

        // Si l'utilisateur n'a pas d'abonnement, ignorer
        if (subscriptions.length === 0) {
          continue;
        }

        // Envoi de notification à chaque abonnement
        for (const subscription of subscriptions) {
          const keys = typeof subscription.keys === 'string' ? JSON.parse(subscription.keys) : subscription.keys;

          const pushSubscription: PushSubscription = {
            endpoint: subscription.endpoint,
            keys: keys,
          };

          try {
            await webPush.sendNotification(pushSubscription, JSON.stringify(notificationPayload));
            console.log('Notification envoyée à', subscription.endpoint);
          } catch (err) {
            console.error('Erreur lors de l\'envoi de la notification à l\'endpoint:', subscription.endpoint, err);
          }
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  }
}
