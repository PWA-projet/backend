import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

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
    router.get('/:id', [ChannelController, 'show'])
    router.post('/join', [ChannelController, 'join'])
  })
  .use(middleware.auth())
  .prefix('channel')

router
  .group(() => {
    router.get('/', [MessageController, 'index'])
    router.post('/', [MessageController, 'store'])

  })
  .use(middleware.auth())
  .prefix('message')


