import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
// import transmit from '@adonisjs/transmit/services/main'

const AuthController = () => import('#controllers/auth_controller')
const ChannelController = () => import('#controllers/channel_controller')
const MessageController = () => import('#controllers/message_controller')

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.delete('logout', [AuthController, 'logout']).use(middleware.auth())
    router
      .get('me', async ({ auth, response }) => {
        try {
          const user = auth.getUserOrFail()
          return response.ok(user)
        } catch (error) {
          return response.unauthorized({ error: 'User not found' })
        }
      })
      .use(middleware.auth())
  })
  .prefix('auth')

router
  .group(() => {
    router.get('/', [ChannelController, 'index'])
    router.post('/', [ChannelController, 'create'])
    router.get('/:channelId', [ChannelController, 'show'])
    router.post('/join', [ChannelController, 'join'])
    router.get('/:channelId/message', [MessageController, 'index'])
    router.post('/:channelId/message', [MessageController, 'store'])

  })
  .use(middleware.auth())
  .prefix('channel')


const EventStreamController = () => import('#controllers/event_streams_controller')
const SubscribesController = () => import('#controllers/subscribes_controller')
const UnsubscribesController = () => import('#controllers/unsubscribes_controller')

router.get('/__transmit/events', [EventStreamController])
router.post('/__transmit/subscribe', [SubscribesController])
router.post('/__transmit/unsubscribe', [UnsubscribesController])


