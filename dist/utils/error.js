export function isDuplicateEntryError(err) {
    return (typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === 'ER_DUP_ENTRY');
}
