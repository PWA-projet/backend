import transmit from '@adonisjs/transmit/services/main'
import Channel from "#models/channel";
import type { HttpContext } from '@adonisjs/core/http'
import User from "#models/user";

transmit.authorize<{ id: string }>('channel/:id/message', async (ctx: HttpContext, { id }) => {
  const channel = await Channel.findOrFail(+id);

  // Ensure bouncer allows type matches
  return ctx.bouncer.allows('accessChannel', ctx.auth.user as User, channel);
});

