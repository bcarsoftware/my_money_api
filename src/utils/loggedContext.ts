

export async function loggedContext<T>(
  { userId }: MyContext,
  fn: (em: EntityManager) => Promise<T>
): Promise<T> {
  if (!userId || !isUUID(userId)) throw new Error(USER_NOT_FOUND);

  return AppDataSource.transaction(async (em) => {
    await em.query(`SET LOCAL app.current_user_id = '${userId}'`);
    return fn(em);
  });
}
