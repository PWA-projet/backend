import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from "luxon";

export default class UserChannel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare channelId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
