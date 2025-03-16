import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare endpoint: string

  @column()
  declare keys: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
