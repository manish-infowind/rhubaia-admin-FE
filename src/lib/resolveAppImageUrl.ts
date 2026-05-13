import { APP_IMAGES_ORIGIN } from '@/api/config';

/**
 * Rewrites URLs whose path is `/app-images` or `/app-images/...` to use {@link APP_IMAGES_ORIGIN}.
 */
export function resolveAppImageUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  const base = APP_IMAGES_ORIGIN.endsWith('/') ? APP_IMAGES_ORIGIN : `${APP_IMAGES_ORIGIN}/`;
  let parsed: URL;
  try {
    parsed = new URL(trimmed, base);
  } catch {
    return trimmed;
  }

  const { pathname, search, hash } = parsed;
  if (pathname !== '/app-images' && !pathname.startsWith('/app-images/')) {
    return trimmed;
  }

  const origin = APP_IMAGES_ORIGIN.replace(/\/$/, '');
  return `${origin}${pathname}${search}${hash}`;
}
