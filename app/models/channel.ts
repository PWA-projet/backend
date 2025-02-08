import { DateTime } from 'luxon'
import { BaseModel, hasMany, column, beforeCreate, manyToMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import Message from '#models/message'
import { randomBytes } from "node:crypto";
import User from "#models/user";

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare key: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Message)
  declare messages: relations.HasMany<typeof Message>

  @manyToMany(() => User, {
    pivotTable: 'users_channels',
  })
  declare users: relations.ManyToMany<typeof User>

  // Hook pour générer une clé avant la création du channel
  @beforeCreate()
  static async generateKey(channel: Channel) {
    channel.key = randomBytes(3).toString('hex').toUpperCase()
  }
}
