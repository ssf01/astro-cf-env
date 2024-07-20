import { column, defineDb, defineTable, NOW } from "astro:db";

export const user = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		email: column.text(),
		picture: column.text(),
		name: column.text(),
		google_id: column.text({ unique: true }),
		time: column.date({ default: NOW }),
	},
});

export const session = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		expiresAt: column.date(),
		userId: column.text({ references: () => user.columns.id }),
	},
});

// https://astro.build/db/config
export default defineDb({
	tables: {
		user,
		session,
	},
});
