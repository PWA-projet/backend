import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import User from "#models/user";

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare content: string

  @column()
  declare channelId: number

  @column({ serializeAs: null })
  declare authorId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Channel)
  declare channel: relations.BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'authorId' })
  declare author: relations.BelongsTo<typeof User>
}
