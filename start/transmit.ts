import transmit from '@adonisjs/transmit/services/main'
import Channel from "#models/channel";
import type { HttpContext } from '@adonisjs/core/http'

transmit.authorize<{ id: string }>('channel/:id/message', async (ctx: HttpContext, { id }) => {
  const channel = await Channel.findOrFail(+id);

  return ctx.bouncer.allows('accessChannel', channel);
});

