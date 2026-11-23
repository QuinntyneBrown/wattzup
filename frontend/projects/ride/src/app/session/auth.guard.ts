import { inject } from '@angular/core';
import {
  type ActivatedRouteSnapshot,
  type CanActivateChildFn,
  Router,
  type RouterStateSnapshot,
} from '@angular/router';
import { CURRENT_RIDER } from '@telo/api';

/**
 * Every screen but sign-in, the code screen and not-found needs a rider (L2-001 AC1): when the session has ended, the
 * screen asked for opens sign-in, which returns to it. A rider with no display name is asked for one first, and then
 * returns to it too (L2-005 AC1). When the backend cannot be reached, the screen opens all the same, so a ride never
 * waits for the network (L2-004 AC5).
 */
export const authGuard: CanActivateChildFn = async (_child, state) => {
  const rider = inject(CURRENT_RIDER);
  const router = inject(Router);
  if (openToAll(state)) {
    return true;
  }
  const status = await rider.load();
  if (status === 'signedOut') {
    return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
  }
  if (status === 'signedIn' && rider.rider()?.displayName === null) {
    return router.createUrlTree(['/sign-in/name'], { queryParams: { returnUrl: state.url } });
  }
  return true;
};

function openToAll(state: RouterStateSnapshot): boolean {
  let leaf: ActivatedRouteSnapshot = state.root;
  while (leaf.firstChild) {
    leaf = leaf.firstChild;
  }
  return state.url.startsWith('/sign-in') || leaf.routeConfig?.path === '**';
}
