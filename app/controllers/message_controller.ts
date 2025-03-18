import { HttpContext } from "@adonisjs/core/http";
import UserChannel from "#models/user_channel";
import Message from "#models/message";
import { storeValidator } from "#validators/message";
import NotificationController from "#controllers/notification_controller";

export default class MessageController {
  async index({ auth, params, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()
      const { channelId } = params;

      const userChannel = await UserChannel.query()
        .where({ userId: authUser.id, channelId })
        .first();

      if (!userChannel) {
        return response.forbidden({ message: "Vous n'avez pas accès à ce channel" });
      }

      const messages = await Message.query()
        .where({ channelId })
        .preload('author', (query) => query.select('id', 'name'))
        .orderBy('createdAt', 'asc');

      return response.ok(messages);
    } catch {
      return response.internalServerError({ message: 'Une erreur est survenue, veuillez réessayer plus tard.' });
    }
  }


  async store({ auth, params, request, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()
      const { channelId } = params
      const { content } = await request.validateUsing(storeValidator)

      if (!content?.trim()) {
        return response.badRequest({ message: 'Le contenu du message ne peut pas être vide.' })
      }

      const userChannel = await UserChannel.query()
        .where({ userId: authUser.id, channelId })
        .first()

      if (!userChannel) {
        return response.forbidden({ message: "Vous n'avez pas accès à ce channel." })
      }

      const message = await Message.create({ content, channelId, authorId: authUser.id })
      await new NotificationController().sendToUsersChannel(channelId, authUser, content)

      return response.created(message)
    } catch {
      return response.internalServerError({
        message: 'Une erreur est survenue, veuillez réessayer plus tard.',
      })
    }
  }
}
