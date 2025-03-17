import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from "#models/user";
import * as relations from "@adonisjs/lucid/types/relations";

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare endpoint: string

  @column()
  declare keys: string

  @column()
  declare userId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relation avec le modèle User
  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>
}
