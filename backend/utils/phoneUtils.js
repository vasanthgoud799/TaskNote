export const normalizePhone = (phone = "") => String(phone).replace(/[^\d+]/g, "").trim();

export const isValidPhone = (phone = "") => {
  const normalized = normalizePhone(phone);
  return !normalized || /^\+?[1-9]\d{7,14}$/.test(normalized);
};
