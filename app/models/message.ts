import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import User from "#models/user";

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare content: string

  @column()
  declare channelId: string

  @column({ serializeAs: null })
  declare authorId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Channel)
  declare channel: relations.BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'authorId' })
  declare author: relations.BelongsTo<typeof User>
}
