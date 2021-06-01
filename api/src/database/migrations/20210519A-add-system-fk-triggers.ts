import { Knex } from 'knex';
import logger from '../../logger';

/**
 * Things to keep in mind:
 *
 * - Can't have circular constraints (field -> parent_field)
 * - Can't have two constraints from/to the same table (user_created/user_modified -> users)
 *
 * The following updates are all the times we can rely on the DB to do the cascade. The rest will
 * have to be handled in the API. I don't make the rules.
 */

const updates = [
	{
		table: 'directus_files',
		constraints: [
			{
				column: 'folder',
				references: 'directus_folders.id',
				on_delete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_permissions',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_presets',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				on_delete: 'CASCADE',
			},
			{
				column: 'role',
				references: 'directus_roles.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_revisions',
		constraints: [
			{
				column: 'activity',
				references: 'directus_activity.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_sessions',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_users',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				on_delete: 'SET NULL',
			},
		],
	},
];

export async function up(knex: Knex): Promise<void> {
	for (const update of updates) {
		for (const constraint of update.constraints) {
			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.dropForeign([constraint.column]);
				});
			} catch (err) {
				logger.warn(`Couldn't drop foreign key ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}

			try {
				await knex.schema.alterTable(update.table, (table) => {
					for (const constraint of update.constraints) {
						table.foreign(constraint.column).references(constraint.references).onDelete(constraint.on_delete);
					}
				});
			} catch (err) {
				logger.warn(`Couldn't add foreign key to ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	for (const update of updates) {
		for (const constraint of update.constraints) {
			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.dropForeign([constraint.column]);
				});
			} catch (err) {
				logger.warn(`Couldn't drop foreign key ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}

			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.foreign(constraint.column).references(constraint.references);
				});
			} catch (err) {
				logger.warn(`Couldn't add foreign key to ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}
		}
	}
}
