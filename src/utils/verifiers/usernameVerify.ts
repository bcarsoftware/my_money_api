export function usernameVerify(username: string): boolean {
  if (!username || typeof username !== "string") return false;

  const regex = /^[a-z][a-z0-9\_\-]{2,128}$/;

  return regex.test(username);
}
