export async function filterAsync<T, U>(
  array: T[],
  callback: (value: T, index: number, array: readonly T[]) => U,
): Promise<T[]> {
  const boolArr = await Promise.all(array.map(callback));
  return array.filter((_, index) => boolArr[index]);
}

export async function mapAsync(array, callback): Promise<any[]> {
  return await Promise.all(array.map(callback));
}
