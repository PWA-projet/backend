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
    pivotTable: 'user_channels',
  })
  declare users: relations.ManyToMany<typeof User>

  @beforeCreate()
  static async generateKey(channel: Channel) {
    let key: string
    let exists: boolean

    // Boucle pour générer une clé unique
    do {
      key = randomBytes(4).toString('hex').toUpperCase()  // Générer une clé aléatoire de 6 caractères
      exists = !!(await Channel.query().where('key', key).first())  // Vérifier si la clé existe déjà
    } while (exists)  // Si la clé existe, générer une nouvelle clé

    channel.key = key
  }
}
