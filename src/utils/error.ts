export function rootCause(err: unknown): unknown {
  let current = err;
  while (
    typeof current === 'object' &&
    current !== null &&
    'cause' in current &&
    (current as { cause: unknown }).cause !== undefined &&
    (current as { cause: unknown }).cause !== null
  ) {
    current = (current as { cause: unknown }).cause;
  }
  return current;
}

export function isDuplicateEntryError(err: unknown): boolean {
  const root = rootCause(err);
  return (
    typeof root === 'object' &&
    root !== null &&
    'code' in root &&
    (root as { code: string }).code === 'ER_DUP_ENTRY'
  );
}
