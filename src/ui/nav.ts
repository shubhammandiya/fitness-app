import { router, type Href } from 'expo-router';

/**
 * `router.back()` throws "The action 'GO_BACK' was not handled" when the screen
 * was opened directly (deep link, reload, app restored onto a sub-route) because
 * there is no history entry. Always fall back to a real destination.
 */
export function goBack(fallback: Href = '/programs') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
