export function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            const message = result.error.issues[0]?.message || 'Data tidak valid';
            res.status(400).json({ success: false, message });
            return;
        }
        req[source] = result.data;
        next();
    };
}
export function validateQuery(schema) {
    return validate(schema, 'query');
}
