import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { students } from '../db/schema.js';
import { formatDateTime } from '../utils/date.js';
export async function listActive() {
    const rows = await db
        .select({
        id: students.id,
        nis: students.nis,
        name: students.name,
        class: students.class,
    })
        .from(students)
        .where(eq(students.isActive, true))
        .orderBy(students.name);
    return rows.map(r => ({ id: r.id, nis: r.nis, name: r.name, class: r.class }));
}
export async function findById(id) {
    const rows = await db
        .select({
        id: students.id,
        nis: students.nis,
        name: students.name,
        class: students.class,
    })
        .from(students)
        .where(eq(students.id, id))
        .limit(1);
    return rows[0] ?? null;
}
export async function insertStudent(nis, name, className) {
    const [header] = await db
        .insert(students)
        .values({ nis, name, class: className })
        .then(r => r);
    return header.insertId;
}
export async function listStudents(limit = 20, offset = 0) {
    const rows = await db
        .select({
        id: students.id,
        nis: students.nis,
        name: students.name,
        class: students.class,
        isActive: students.isActive,
        createdAt: students.createdAt,
    })
        .from(students)
        .orderBy(desc(students.id))
        .limit(limit)
        .offset(offset);
    const countResult = await db
        .select({ total: sql `COUNT(*)` })
        .from(students);
    return {
        data: rows.map(r => ({
            id: r.id,
            nis: r.nis,
            name: r.name,
            class: r.class,
            is_active: r.isActive,
            created_at: r.createdAt ? formatDateTime(r.createdAt) : null,
        })),
        total: Number(countResult[0].total),
    };
}
