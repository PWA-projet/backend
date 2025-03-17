import type { HttpContext } from "@adonisjs/core/http";
import Subscription from "#models/subscription";
import webPush, {PushSubscription} from 'web-push'
import env from "#start/env";
import UserChannel from "#models/user_channel";

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

  // async send({ request, response }: HttpContext) {
  //   try {
  //     // Récupère le payload de la notification (titre et message)
  //     const { title, message } = request.only(['title', 'message']);
  //
  //     // Configure les clés VAPID pour web-push
  //     webPush.setVapidDetails(
  //       `mailto:${env.get('VAPID_EMAIL')}`, // Remplacez par votre email
  //       env.get('VAPID_PUBLIC_KEY'), // Clé publique de VAPID
  //       env.get('VAPID_PRIVATE_KEY') // Clé privée de VAPID
  //     );
  //
  //     // Récupère toutes les abonnements de la base de données
  //     const subscriptions = await Subscription.all();
  //     console.log('Total subscriptions:', subscriptions.length);
  //
  //     // Définir le payload de la notification
  //     const notificationPayload = {
  //       notification: {
  //         title: title || 'Nouvelle notification', // Si title n'est pas fourni
  //         body: message || 'Voici un message de notification', // Si message n'est pas fourni
  //         icon: 'assets/main-page-logo-small-hat.png', // Peut être changé
  //         vibrate: [100, 50, 100], // Pour la vibration du téléphone
  //         data: {
  //           dateOfArrival: Date.now(),
  //           primaryKey: Date.now(), // Peut être modifié selon vos besoins
  //         },
  //         actions: [
  //           {
  //             action: 'explore',
  //             title: 'Allez sur le site',
  //           },
  //         ],
  //       },
  //     };
  //
  //     // Envoie la notification à chaque abonnement
  //     const notifications = subscriptions.map(async (subscription) => {
  //       // Vérifie si les clés sont stockées sous forme de chaîne et les analyse
  //       const keys = typeof subscription.keys === 'string' ? JSON.parse(subscription.keys) : subscription.keys;
  //
  //       const pushSubscription: PushSubscription = {
  //         endpoint: subscription.endpoint,
  //         keys: keys,
  //       };
  //
  //       // Tente d'envoyer la notification
  //       try {
  //         await webPush.sendNotification(pushSubscription, JSON.stringify(notificationPayload));
  //         console.log('Notification envoyée à', subscription.endpoint);
  //       } catch (err) {
  //         console.error('Erreur lors de l\'envoi de la notification à l\'endpoint:', subscription.endpoint, err);
  //       }
  //     });
  //
  //     // Attends que toutes les notifications soient envoyées
  //     await Promise.all(notifications);
  //
  //     // Réponse après l'envoi de toutes les notifications
  //     return response.ok({ message: 'Notifications envoyées avec succès !' });
  //   } catch (error) {
  //     console.error('Erreur lors de l\'envoi des notifications:', error);
  //     return response.internalServerError({ message: 'Échec de l\'envoi des notifications.' });
  //   }
  // }

  async sendToUsersChannel(channelId: number, title: string, message: string) {
    try {
      // Récupérer tous les utilisateurs abonnés au canal
      const userChannels = await UserChannel.query()
        .where('channelId', channelId)
        .preload('user'); // Charger les informations des utilisateurs

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

      // Définir le payload de la notification
      const notificationPayload = {
        notification: {
          title: title || 'Nouvelle notification',
          body: message || 'Voici un message de notification',
          icon: 'assets/main-page-logo-small-hat.png',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: Date.now(),
          },
          actions: [
            {
              action: 'explore',
              title: 'Allez sur le site',
            },
          ],
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
