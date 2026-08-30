export function updatableFieldResolve<T>(
  newValue: T | null | undefined,
  currentValue: T | null | undefined
): T | null | undefined {
  if (newValue === null) return null;
  if (newValue && newValue !== currentValue) return newValue;
  return currentValue;
}
