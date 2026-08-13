import { mysqlTable, int, varchar, date, time, boolean, timestamp, uniqueIndex, foreignKey } from 'drizzle-orm/mysql-core';
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
  studentId: int('student_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }),
}, (table) => ({
  uidUnique: uniqueIndex('uq_cards_uid').on(table.uid),
  studentFk: foreignKey({
    name: 'fk_cards_student',
    columns: [table.studentId],
    foreignColumns: [students.id],
  })
    .onDelete('restrict')
    .onUpdate('cascade'),
}));

export const attendance = mysqlTable('attendance', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  time: time('time').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
}, (table) => ({
  uniqueStudentDate: uniqueIndex('uq_attendance_student_date').on(table.studentId, table.date),
  studentFk: foreignKey({
    name: 'fk_attendance_student',
    columns: [table.studentId],
    foreignColumns: [students.id],
  })
    .onDelete('restrict')
    .onUpdate('cascade'),
}));

export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: varchar('value', { length: 255 }).notNull(),
});

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  class: varchar('class', { length: 20 }),
  createdAt: timestamp('created_at', { mode: 'date' }),
}, (table) => ({
  usernameUnique: uniqueIndex('uq_users_username').on(table.username),
}));
