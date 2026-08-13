import { isDuplicateEntryError } from './error.js';

export async function writeOrDuplicate<T>(
  write: () => PromiseLike<unknown>,
  onDuplicate: () => PromiseLike<T> | T,
): Promise<T | null> {
  try {
    await write();
  } catch (err) {
    if (isDuplicateEntryError(err)) {
      const result = await onDuplicate();
      if (result === null) throw err;
      return result;
    }
    throw err;
  }
  return null;
}
