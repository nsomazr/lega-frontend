/**
 * Session manager to prevent duplicate session expiration messages
 */

let sessionExpiredShown = false;
let redirectInProgress = false;

export function markSessionExpired(): void {
  sessionExpiredShown = true;
  // Reset after 5 seconds to allow for future session expirations
  setTimeout(() => {
    sessionExpiredShown = false;
  }, 5000);
}

export function isSessionExpiredShown(): boolean {
  return sessionExpiredShown;
}

export function setRedirectInProgress(value: boolean): void {
  redirectInProgress = value;
}

export function isRedirectInProgress(): boolean {
  return redirectInProgress;
}

export function resetSessionState(): void {
  sessionExpiredShown = false;
  redirectInProgress = false;
}
