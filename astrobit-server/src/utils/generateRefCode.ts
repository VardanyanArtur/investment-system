export const generateReferralCode = (userId: string) => {
  return `${Date.now()}-${userId}`;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;
