import type { HttpContext } from "@adonisjs/core/http";
import Subscription from "#models/subscription";
import webPush, {PushSubscription} from 'web-push'
import env from "#start/env";

export default class NotificationController {
  async subscribe({ request, response }: HttpContext) {
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
    })

    return response.created({ message: 'Abonnement enregistré !', subscription })
  }

  async send({ request, response }: HttpContext) {
    try {
      // Récupère le payload de la notification (titre et message)
      const { title, message } = request.only(['title', 'message']);

      // Récupère toutes les abonnements de la base de données
      const subscriptions = await Subscription.all();

      // Configure les clés VAPID pour web-push
      webPush.setVapidDetails(
        `mailto:${env.get('VAPID_EMAIL')}`, // Remplacez par votre email
        env.get('VAPID_PUBLIC_KEY'), // Clé publique de VAPID
        env.get('VAPID_PRIVATE_KEY') // Clé privée de VAPID
      );

      // Envoie la notification à chaque abonnement
      const notifications = subscriptions.map(async (subscription) => {
        const pushSubscription: PushSubscription = {
          endpoint: subscription.endpoint,
          keys: JSON.parse(subscription.keys),
        };

        // Tente d'envoyer la notification
        try {
          await webPush.sendNotification(pushSubscription, JSON.stringify({ title, message }));
        } catch (err) {
          console.error('Erreur lors de l\'envoi de la notification à l\'endpoint:', pushSubscription.endpoint, err);
        }
      });

      // Attends que toutes les notifications soient envoyées
      await Promise.all(notifications);

      // Réponse après envoi de toutes les notifications
      return response.ok({ message: 'Notifications envoyées avec succès !' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      return response.internalServerError({ message: 'Échec de l\'envoi des notifications.' });
    }
  }
}
