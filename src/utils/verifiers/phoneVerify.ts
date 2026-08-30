export function phoneVerify(phone: string) {
  const phoneRegex = /^\+?[0-9]{10,13}$/;
  if (!phoneRegex.test(phone)) return false;
  return true;
}
