import type { HttpContext } from "@adonisjs/core/http";
import Channel from "#models/channel";
import { createValidator } from "#validators/channel";
import UserChannel from "#models/user_channel";

export default class ChannelController {
  async index({ auth, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()

      const channelIds = (await UserChannel.query().where('userId', authUser.id)).map(
        (uc) => uc.channelId
      )

      const channels = await Channel.query().whereIn('id', channelIds)

      return response.ok(channels)
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des channels'
      })
    }
  }

  async create({ auth, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createValidator)
      const authUser = auth.getUserOrFail()

      const channel = await Channel.create(payload)

      await UserChannel.create({
        userId: authUser.id,
        channelId: channel.id,
      })

      return response.ok({ message: 'Vous avez créé le channel avec succès' })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la création du channel'
      })
    }
  }

  async show({ auth, params, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail();
      const { channelId } = params;

      const userChannel = await UserChannel.query()
        .where({ userId: authUser.id, channelId })
        .first()

      if (!userChannel) {
        return response.forbidden({ message: "Vous n'êtes pas membre de ce channel" });
      }

      const channel = await Channel.query()
        .where('id', channelId)
        .preload('users', (query) => query.select('id', 'name'))
        .firstOrFail()

      return response.ok({
        id: channel.id,
        name: channel.name,
        key: channel.key,
        members: channel.users.map(({ id, name }) => ({ id, name }))
      })
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Erreur lors de la récupération du channel'
      });
    }
  }

  async join({ auth, request, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()
      const { key } = request.only(['key'])

      const channel = await Channel.findBy('key', key)
      if (!channel) {
        return response.notFound({ message: 'Channel introuvable avec cette clé' })
      }

      const existingEntry = await UserChannel.query()
        .where({ userId: authUser.id, channelId: channel.id })
        .first()

      if (existingEntry) {
        return response.badRequest({ message: 'Vous êtes déjà membre de ce channel' })
      }

      await UserChannel.create({
        userId: authUser.id,
        channelId: channel.id,
      })

      return response.ok({ message: 'Vous avez rejoint le channel avec succès', channel })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la tentative de rejoindre le channel'
      })
    }
  }
}
