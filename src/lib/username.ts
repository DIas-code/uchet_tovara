// Вход по логину без email. Supabase аутентифицирует по email, поэтому
// логин превращается в служебный адрес вида "логин@uchet.local".
// Пользователь видит и вводит только логин.
export const INTERNAL_EMAIL_DOMAIN = "uchet.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;
}
