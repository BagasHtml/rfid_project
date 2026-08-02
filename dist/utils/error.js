export function rootCause(err) {
    let current = err;
    while (typeof current === 'object' &&
        current !== null &&
        'cause' in current &&
        current.cause !== undefined &&
        current.cause !== null) {
        current = current.cause;
    }
    return current;
}
export function isDuplicateEntryError(err) {
    const root = rootCause(err);
    return (typeof root === 'object' &&
        root !== null &&
        'code' in root &&
        root.code === 'ER_DUP_ENTRY');
}
