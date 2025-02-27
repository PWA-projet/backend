import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)
      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user)

      return response.ok({
        token: token,
        ...user.serialize(),
      })
    } catch (error) {
      return response.badRequest({ message: 'Invalid credentials', error: error.message })
    }
  }

  async register({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerValidator)
      const user = await User.create(payload)
      return response.created(user)
    } catch (error) {
      return response.badRequest({ message: 'Registration failed', error: error.message })
    }
  }

  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const token = auth.user?.currentAccessToken.identifier

      if (!token) {
        return response.badRequest({ message: 'Token not found' })
      }

      await User.accessTokens.delete(user, token)
      return response.ok({ message: 'Logged out' })
    } catch (error) {
      return response.badRequest({ message: 'Logout failed', error: error.message })
    }
  }
}
