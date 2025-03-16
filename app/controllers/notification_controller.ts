import type { HttpContext } from "@adonisjs/core/http";
import Subscription from "#models/subscription";
import webPush from 'web-push'
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
      const { title, body, url } = request.only(['title', 'body', 'url']);

      // Récupérer toutes les abonnements stockés en base
      const subscriptions = await Subscription.all();

      if (subscriptions.length === 0) {
        return response.ok({ message: 'Aucun abonné pour recevoir la notification.' });
      }

      // Charger les clés VAPID depuis les variables d'environnement
      const publicKey = env.get('VAPID_PUBLIC_KEY');
      const privateKey = env.get('VAPID_PRIVATE_KEY');

      if (!publicKey || !privateKey) {
        return response.internalServerError({ message: 'Clés VAPID manquantes dans les variables d\'environnement.' });
      }

      // Configurer les détails VAPID
      webPush.setVapidDetails(
        'mailto:gabet.thibaut@gmail.com',  // L'adresse email de contact
        publicKey,  // Clé publique VAPID
        privateKey  // Clé privée VAPID
      );

      // Contenu de la notification
      const payload = JSON.stringify({ title, body, url });

      // Envoyer une notification à chaque abonné
      const sendPromises = subscriptions.map(async (subscription) => {
        const pushSubscription = JSON.parse(subscription.keys);

        try {
          await webPush.sendNotification(pushSubscription, payload);
        } catch (err) {
          console.error('Erreur en envoyant la notification:', err);
        }
      });

      await Promise.all(sendPromises);

      return response.ok({ message: 'Notification envoyée avec succès !' });

    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de l\'envoi de la notification.'
      })
    }
  }
}
