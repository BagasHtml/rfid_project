export function buildStudentInfo(card) {
    return {
        name: card.student_name,
        class: card.student_class,
        nis: card.student_nis,
    };
}
