import {
  mysqlTable,
  int,
  varchar,
  date,
  time,
  boolean,
  timestamp,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';

const pk = () => int('id').primaryKey().autoincrement();
const isActive = () => boolean('is_active').notNull().default(true);
const createdAt = () => timestamp('created_at', { mode: 'date' });

const fkToStudents = (
  name: string,
  columns: Parameters<typeof foreignKey>[0]['columns'],
) =>
  foreignKey({ name, columns, foreignColumns: [students.id] })
    .onDelete('restrict')
    .onUpdate('cascade');

export const students = mysqlTable('students', {
  id: pk(),
  nis: varchar('nis', { length: 32 }).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  class: varchar('class', { length: 16 }).notNull(),
  isActive: isActive(),
  createdAt: createdAt(),
}, (t) => ({
  nisUnique: uniqueIndex('uq_students_nis').on(t.nis),
}));

export const cards = mysqlTable('cards', {
  id: pk(),
  uid: varchar('uid', { length: 32 }).notNull(),
  studentId: int('student_id').notNull(),
  isActive: isActive(),
  createdAt: createdAt(),
}, (t) => ({
  uidUnique: uniqueIndex('uq_cards_uid').on(t.uid),
  studentFk: fkToStudents('fk_cards_student', [t.studentId]),
}));

export const attendance = mysqlTable('attendance', {
  id: pk(),
  studentId: int('student_id').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  time: time('time').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  keterangan: varchar('keterangan', { length: 255 }),
}, (t) => ({
  uniqueStudentDate: uniqueIndex('uq_attendance_student_date').on(t.studentId, t.date),
  studentFk: fkToStudents('fk_attendance_student', [t.studentId]),
}));

export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: varchar('value', { length: 255 }).notNull(),
});

export const users = mysqlTable('users', {
  id: pk(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  class: varchar('class', { length: 20 }),
  createdAt: createdAt(),
}, (t) => ({
  usernameUnique: uniqueIndex('uq_users_username').on(t.username),
}));
