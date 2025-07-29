export function handleAuthError() {
  localStorage.removeItem("wikifacts_user");
  window.location.href = '/';
}

export function isTokenExpiredError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : '';
  return errorMessage.includes('Failed to fetch') || 
         errorMessage.includes('authentication') ||
         errorMessage.includes('401');
}

export function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getValidUser() {
  const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
  if (!userData?.token || !isTokenValid(userData.token)) {
    localStorage.removeItem("wikifacts_user");
    return null;
  }
  return userData;
}