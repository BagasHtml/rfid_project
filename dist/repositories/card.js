import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cards, students } from '../db/schema.js';
import { formatDateTime } from '../utils/date.js';
export async function insertCard(uid, studentId) {
    const [header] = await db.insert(cards).values({
        uid,
        studentId,
    }).then(r => r);
    return header.insertId;
}
export async function listRecent(limit = 20, offset = 0) {
    const rows = await db
        .select({
        id: cards.id,
        uid: cards.uid,
        isActive: cards.isActive,
        createdAt: cards.createdAt,
        studentName: students.name,
        studentClass: students.class,
        studentNis: students.nis,
    })
        .from(cards)
        .innerJoin(students, eq(cards.studentId, students.id))
        .orderBy(desc(cards.id))
        .limit(limit)
        .offset(offset);
    const countResult = await db
        .select({ total: sql `COUNT(*)` })
        .from(cards);
    return {
        data: rows.map(r => ({
            id: r.id,
            uid: r.uid,
            is_active: r.isActive,
            student_name: r.studentName,
            student_class: r.studentClass,
            student_nis: r.studentNis,
            created_at: r.createdAt ? formatDateTime(r.createdAt) : null,
        })),
        total: Number(countResult[0].total),
    };
}
export async function findActiveByUid(uid) {
    const rows = await db
        .select({
        uid: cards.uid,
        studentId: cards.studentId,
        studentName: students.name,
        studentClass: students.class,
        studentNis: students.nis,
    })
        .from(cards)
        .innerJoin(students, eq(cards.studentId, students.id))
        .where(and(eq(cards.uid, uid), eq(cards.isActive, true), eq(students.isActive, true)))
        .limit(1);
    if (rows.length === 0)
        return null;
    return {
        uid: rows[0].uid,
        student_id: rows[0].studentId,
        student_name: rows[0].studentName,
        student_class: rows[0].studentClass,
        student_nis: rows[0].studentNis,
    };
}
