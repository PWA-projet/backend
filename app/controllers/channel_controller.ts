import type { HttpContext } from "@adonisjs/core/http";
import Channel from "#models/channel";
import { createValidator } from "#validators/channel";
import UserChannel from "#models/user_channel";

export default class ChannelController {
  async create({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createValidator);
    const user = auth.getUserOrFail();

    const channel = await Channel.create(payload);

    // Ajouter l'utilisateur dans la table pivot 'users_channels'
    await UserChannel.create({
      userId: user.id,
      channelId: channel.id
    });

    return response.created(channel);
  }
}

