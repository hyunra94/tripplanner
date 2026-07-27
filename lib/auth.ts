import { cookies } from "next/headers";

const COOKIE_NAME = "trip_auth";

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return !!value && value === process.env.RECORDS_PASSWORD;
}

export function checkPassword(password: string): boolean {
  return password === process.env.RECORDS_PASSWORD;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
