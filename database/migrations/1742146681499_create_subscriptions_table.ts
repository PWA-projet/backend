import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('endpoint').notNullable().unique()
      table.json('keys').notNullable() // Stocke les clés d'authentification
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.timestamps(true) // Ajoute automatiquement `created_at` et `updated_at`
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
