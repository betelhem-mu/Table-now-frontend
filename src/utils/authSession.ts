/**
 * Authentication session management utilities.
 * Ensures session data isolation between different user logins.
 */

export const clearAuthSession = (): void => {
  // Clear primary authentication tokens & user profile
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Clear legacy global un-scoped profile keys to prevent data leakage between sessions
  localStorage.removeItem("customer_display_name");
  localStorage.removeItem("customer_profile_image");
  localStorage.removeItem("provider_display_name");
  localStorage.removeItem("provider_profile_image");
  localStorage.removeItem("rememberMe");
};

export const getCurrentUser = (): any => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const getCurrentUserKey = (user?: any): string => {
  const u = user || getCurrentUser();
  return u.id || u._id || u.email || "";
};
