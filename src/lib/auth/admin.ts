export const ADMIN_EMAIL = 'support@my.ana';

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) {
    return false;
  }
  return email.toLowerCase().trim() === ADMIN_EMAIL;
};
