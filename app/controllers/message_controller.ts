import { HttpContext } from "@adonisjs/core/http";
import UserChannel from "#models/user_channel";
import Message from "#models/message";
import { storeValidator } from "#validators/message";

export default class MessageController {
  async index({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const { channelId } = params;

    // Vérifier si l'utilisateur est bien membre du channel
    const userChannel = await UserChannel.query()
      .where("userId", user.id)
      .where("channelId", channelId)
      .first();

    if (!userChannel) {
      return response.forbidden({ message: "Vous n'avez pas accès à ce channel" });
    }

    // Récupérer tous les messages du channel avec les infos de l'auteur
    const messages = await Message.query()
      .where("channelId", channelId)
      .preload('author', (query) => query.select('id', 'name'))
      .orderBy('createdAt', 'asc');

    return response.ok(messages);
  }

  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const { channelId } = params;
    const payload = await request.validateUsing(storeValidator);
    const { content } = payload;

    // Vérifier si l'utilisateur est bien membre du channel
    const userChannel = await UserChannel.query()
      .where("userId", user.id)
      .where("channelId", channelId)
      .first();

    if (!userChannel) {
      return response.forbidden({ message: "Vous n'avez pas accès à ce channel" });
    }

    // Créer le message
    const message = await Message.create({
      content,
      channelId,
      authorId: user.id,
    });

    return response.created(message);
  }
}
