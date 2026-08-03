import { isDuplicateEntryError } from './error.js';

export async function writeOrDuplicate<T>(
  write: () => PromiseLike<unknown>,
  onDuplicate: () => PromiseLike<T> | T,
): Promise<T | null> {
  try {
    await write();
  } catch (err) {
    if (isDuplicateEntryError(err)) return await onDuplicate();
    throw err;
  }
  return null;
}
