export const getToken = () => {
  if (typeof document === "undefined") return null;

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
};

export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const setTokenCookie = (token, maxAge = 60 * 60 * 24 * 7) => {
  if (typeof document === "undefined") return;

  const cookieParts = [
    `token=${token}`,
    "path=/",
    `max-age=${maxAge}`,
    "SameSite=Lax"
  ];

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookieParts.push("Secure");
  }

  document.cookie = cookieParts.join("; ");
};

export const clearTokenCookie = () => {
  if (typeof document === "undefined") return;

  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00; SameSite=Lax";
};
