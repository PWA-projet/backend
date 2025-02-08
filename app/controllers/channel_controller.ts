import type { HttpContext } from "@adonisjs/core/http";
import Channel from "#models/channel";
import { createValidator } from "#validators/channel";
import UserChannel from "#models/user_channel";

export default class ChannelController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Récupérer les channels auxquels l'utilisateur est associé
    const userChannels = await UserChannel.query()
      .where('userId', user.id)
      .select('channelId');

    const channelIds = userChannels.map(uc => uc.channelId);

    // Récupérer uniquement les channels correspondants
    const channels = await Channel.query().whereIn('id', channelIds);

    return response.ok(channels);
  }

  async create({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createValidator)
    const user = auth.getUserOrFail()

    const channel = await Channel.create(payload)

    // Ajouter l'utilisateur dans la table pivot 'user_channels'
    await UserChannel.create({
      userId: user.id,
      channelId: channel.id,
    })

    return response.created(channel)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { id } = params;

    // Vérifier si l'utilisateur est bien membre du channel
    const userChannel = await UserChannel.query()
      .where('userId', user.id)
      .where('channelId', id)
      .first();

    if (!userChannel) {
      return response.forbidden({ message: "Vous n'êtes pas membre de ce channel" });
    }

    // Récupérer le channel
    const channel = await Channel.find(id);
    if (!channel) {
      return response.notFound({ message: "Channel introuvable" });
    }

    return response.ok(channel);
  }

  async join({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { key } = request.only(['key']);

    // Vérifier si un channel existe avec cette clé
    const channel = await Channel.findBy('key', key);
    if (!channel) {
      return response.notFound({ message: "Channel introuvable avec cette clé" });
    }

    // Vérifier si l'utilisateur est déjà dans le channel
    const existingEntry = await UserChannel.query()
      .where('userId', user.id)
      .where('channelId', channel.id)
      .first();

    if (existingEntry) {
      return response.badRequest({ message: "Vous êtes déjà membre de ce channel" });
    }

    // Ajouter l'utilisateur au channel
    await UserChannel.create({
      userId: user.id,
      channelId: channel.id,
    });

    return response.ok({ message: "Vous avez rejoint le channel avec succès", channel });
  }
}

