import { cookies } from "next/headers";

const COOKIE_NAME = "trip_auth";

export function isAuthed(): boolean {
  const value = cookies().get(COOKIE_NAME)?.value;
  return !!value && value === process.env.RECORDS_PASSWORD;
}

export function checkPassword(password: string): boolean {
  return password === process.env.RECORDS_PASSWORD;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
