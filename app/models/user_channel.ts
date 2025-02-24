import {BaseModel, belongsTo, column} from '@adonisjs/lucid/orm'
import { DateTime } from "luxon";
import User from "#models/user";
import Channel from "#models/channel";
import * as relations from "@adonisjs/lucid/types/relations";

export default class UserChannel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare channelId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relation avec le modèle User
  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  // Relation avec le modèle Channel
  @belongsTo(() => Channel)
  declare channel: relations.BelongsTo<typeof Channel>
}
