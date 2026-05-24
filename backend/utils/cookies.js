export const getCookieOptions = () => {
  const isHttpsDeployment = [
    process.env.CLIENT_URL,
    process.env.CLIENT_ORIGIN,
    process.env.CLIENT_ORIGINS,
    process.env.FRONTEND_URL,
  ].some((value = "") => value.includes("https://"));

  const useSecureCookie =
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    isHttpsDeployment;

  return {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: useSecureCookie ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};
