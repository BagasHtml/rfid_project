import { mysqlTable, int, varchar, date, time, boolean, timestamp, uniqueIndex } from 'drizzle-orm/mysql-core';
export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  nis: varchar('nis', { length: 32 }).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  class: varchar('class', { length: 16 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }),
}, (table) => ({
  nisUnique: uniqueIndex('uq_students_nis').on(table.nis),
}));

export const cards = mysqlTable('cards', {
  id: int('id').primaryKey().autoincrement(),
  uid: varchar('uid', { length: 32 }).notNull(),
  studentId: int('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }),
}, (table) => ({
  uidUnique: uniqueIndex('uq_cards_uid').on(table.uid),
}));

export const attendance = mysqlTable('attendance', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  time: time('time').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
}, (table) => ({
  uniqueStudentDate: uniqueIndex('unique_daily_attendance').on(table.studentId, table.date),
}));

export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: varchar('value', { length: 255 }).notNull(),
});