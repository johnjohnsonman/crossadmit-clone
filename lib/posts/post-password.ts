/** Resolve stored password hash — never expose via API */

export type PostPasswordRow = {
  password_hash?: string | null;
  anonymous_password_hash?: string | null;
};

export function getPostPasswordHash(row: PostPasswordRow): string | null {
  const h = row.password_hash?.trim() || row.anonymous_password_hash?.trim();
  return h || null;
}

export function postHasPassword(row: PostPasswordRow): boolean {
  return Boolean(getPostPasswordHash(row));
}
