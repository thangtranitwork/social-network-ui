'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const locales = ['vi', 'en'];
const defaultLocale = 'vi';
const cookieName = 'NEXT_LOCALE';


/**
 * Server Action: set locale cookie and revalidate the page
 */
export async function setLocaleAction(locale) {
  if (!locales.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(cookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false, // readable by JS for optimistic UI
  });

  revalidatePath('/', 'layout');
}

/**
 * Server Action: get current locale
 */
export async function getLocaleAction() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(cookieName)?.value;
  return locales.includes(localeCookie) ? localeCookie : defaultLocale;
}
