/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Vips.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Shield, Zap, TrendingUp, Star, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useVipPlans, type VipPlan } from "@/hooks/useVipPlans";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";

const iconsMap: Record<string, React.ComponentType<any>> = { Shield, Zap, TrendingUp, Star };
type CalcRow = { month: number; profit: string; total: string };

export default function VIPPage() {
  
  const { t } = useTranslation();
  const { user, token } = useAuth();

  const { data: vipPlans, loading: plansLoading, error: plansError } = useVipPlans();
  const { data: wallet, loading: walletLoading, error: walletError } = useWallet({ token, enabled: Boolean(user) });

  const totalBalance = useMemo(() => {
    if (!wallet) return 0;
    const { depositBalance = 0, earnedBalance = 0, referralBalance = 0 } = wallet;
    return (depositBalance || 0) + (earnedBalance || 0) + (referralBalance || 0);
  }, [wallet]);

  const unlockedIndex = useMemo(() => {
    if (!user || !vipPlans.length) return -1;
    let idx = -1;
    for (let i = 0; i < vipPlans.length; i++) {
      const plan = vipPlans[i];
      const fits = wallet?.depositBalance >= plan.min && (plan.max == null || wallet?.depositBalance <= plan.max);
      if (fits) idx = i;
    }
    return idx;
  }, [user, vipPlans, wallet?.depositBalance]);

  // celebration on level-up
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [celebrateTitle, setCelebrateTitle] = useState("");
  const prevUnlocked = useRef<number>(-1);
  useEffect(() => {
    if (user && unlockedIndex > prevUnlocked.current) {
      const plan = vipPlans[unlockedIndex];
      if (plan) {
        setCelebrateTitle(plan.title);
        setCelebrateOpen(true);
      }
    }
    prevUnlocked.current = unlockedIndex;
  }, [unlockedIndex, user, vipPlans]);

  // calculator
  const [amount, setAmount] = useState<string>("");
  const [results, setResults] = useState<CalcRow[]>([]);

  const findPlanByAmount = (value: number): VipPlan | null => {
    if (!vipPlans.length) return null;
    for (let i = 0; i < vipPlans.length; i++) {
      const p = vipPlans[i];
      const fits = value >= p.min && (p.max == null || value <= p.max);
      if (fits) return p;
    }
    return null;
  };

  const parseDailyPercent = (dailyStr: string): number => {
    const match = dailyStr.match(/([\d.,]+)\s*%/);
    if (!match) return 0;
    const num = parseFloat(match[1].replace(",", "."));
    if (isNaN(num)) return 0;
    return num / 100;
    };

  const handleCalculate = () => {
    const principal = parseFloat(amount);
    if (isNaN(principal) || principal <= 0) {
      setResults([]);
      return;
    }
    const plan = findPlanByAmount(principal);
    if (!plan) {
      setResults([]);
      return;
    }
    const dailyPercent = parseDailyPercent(plan.daily);
    const daysTotal = 6 * 30;
    const monthly: CalcRow[] = [];
    const dailyProfit = principal * dailyPercent;

    for (let day = 1; day <= daysTotal; day++) {
      if (day % 30 === 0) {
        const month = day / 30;
        const totalProfit = dailyProfit * day;
        const totalBalance = principal + totalProfit;
        monthly.push({ month, profit: totalProfit.toFixed(2), total: totalBalance.toFixed(2) });
      }
    }
    setResults(monthly);
  };

  // live activity (optional)
  const [startIndex, setStartIndex] = useState(0);
  const usersShowcase = useMemo(() => {
    const generateRandomUsers = (count = 20) => {
      const randomId = () => `1${Math.floor(100000 + Math.random() * 899999).toString().replace(/(\d{2})\d{2}(\d{2})/, "$1****$2")}`;
      const randomDeposit = () => `+${Math.floor(100 + Math.random() * 6900)}$`;
      const randomVIP = () => {
        if (!vipPlans.length) return "VIP 1";
        return vipPlans[Math.floor(Math.random() * vipPlans.length)].title;
      };
      return Array.from({ length: count }, () => ({ id: randomId(), deposit: randomDeposit(), vip: randomVIP() }));
    };
    return generateRandomUsers(20);
  }, [vipPlans]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 4) % usersShowcase.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [usersShowcase.length]);

  const visibleUsers = usersShowcase.slice(startIndex, startIndex + 4);

  const anyLoading = plansLoading || (user && walletLoading);
  const anyError = plansError || walletError;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/50 to-background pt-8 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          {t("vips.title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("vips.subtitle")}</p>
        {user && (
          <div className="mt-4 text-muted-foreground">
            <span className="font-semibold">{t("vips.yourBalance")}:</span>{" "}
            <span className="text-primary font-bold">${totalBalance.toLocaleString()}</span>
          </div>
        )}
        {anyError && <div className="mt-3 text-sm text-red-500">{anyError}</div>}
      </motion.div>

      {anyLoading ? (
        <div className="min-h-[200px] flex justify-center items-center text-2xl font-semibold">{t("common.loading")}</div>
      ) : (
        <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* VIP Cards */}
          {vipPlans.map((plan, index) => {
            const Icon = iconsMap[plan.icon] || Shield;
            const isUnlocked = index === unlockedIndex && Boolean(user);

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: plan.delay, duration: 0.6 }}
                className={`relative p-6 rounded-2xl text-center flex flex-col justify-between transition-all duration-300 ${
                  isUnlocked
                    ? "border-2 border-primary bg-gradient-to-b from-primary/10 via-primary/5 to-background shadow-[0_0_30px_5px_rgba(0,212,255,0.3)] animate-pulse-bright"
                    : "border border-muted/30 bg-card opacity-90 hover:opacity-100"
                }`}
              >
                <div className="absolute top-4 right-4">
                  {isUnlocked ? <Unlock className="h-7 w-7 text-primary drop-shadow-glow animate-bounce" /> : <Lock className="h-6 w-6 text-muted-foreground" />}
                </div>
                <Icon className={`h-16 w-16 mx-auto mb-4 ${isUnlocked ? "text-primary drop-shadow-glow" : "text-muted-foreground"}`} />
                <h2 className={`text-3xl font-bold mb-2 ${isUnlocked ? "text-primary" : "text-foreground"}`}>{plan.title}</h2>
                <p className="text-lg text-muted-foreground mb-1">
                  {plan.max ? `$${plan.min.toLocaleString()} - $${plan.max.toLocaleString()}` : `$${plan.min.toLocaleString()}+`}
                </p>
                <p className={`text-xl font-semibold mb-1 ${isUnlocked ? "text-secondary" : "text-muted-foreground"}`}>{plan.daily}</p>
                <p className="text-muted-foreground mb-2">
                  {t("vips.cashback")}: <span className="text-primary font-bold">{plan.cashback}</span>
                </p>
                <p className="text-muted-foreground mb-4">
                  {t("vips.duration")}: <span className="text-primary font-bold">{t("vips.days")}</span>
                </p>

                {/* Dialog Trigger */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="px-4 py-2 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition">
                      {t("vips.showMore")}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-bold text-primary mb-4">{plan.title}</DialogTitle>
                    </DialogHeader>
                    <div className="text-muted-foreground space-y-3">
                      <p><strong>{t("vips.range")}:</strong> {plan.max ? `$${plan.min.toLocaleString()} - $${plan.max.toLocaleString()}` : `$${plan.min.toLocaleString()}+`}</p>
                      <p><strong>{t("vips.dailyReward")}:</strong> {plan.daily}</p>
                      <p><strong>{t("vips.cashback")}:</strong> {plan.cashback}</p>
                      <p><strong>{t("vips.duration")}:</strong> {t("vips.days")}</p>
                      <p><strong>{t("vips.itemsBenefits")}:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {plan.items.map((item, idx) => (
                          <li key={idx} className="text-foreground font-medium">{item}</li>
                        ))}
                      </ul>
                      {isUnlocked && <p className="mt-4 text-green-500 font-semibold">{t("vips.unlockedMessage")}</p>}
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            );
          })}

          {/* Calculator card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="relative p-6 rounded-2xl text-center flex flex-col justify-between border-2 border-primary bg-gradient-to-b from-primary/10 via-primary/5 to-background shadow-[0_0_30px_5px_rgba(0,212,255,0.3)] animate-pulse-bright"
          >
            <Calculator className="h-16 w-16 mx-auto mb-4 text-primary drop-shadow-glow" />
            <h2 className="text-3xl font-bold mb-2 text-primary">{t("vips.calculator")}</h2>
            <p className="text-muted-foreground mb-6">{t("vips.calculatorSubtitle")}</p>

            <Dialog>
              <DialogTrigger asChild>
                <button className="px-4 py-2 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition">
                  {t("vips.openCalculator")}
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary mb-4">{t("vips.calculatorTitle")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder={t("vips.enterAmount")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button onClick={handleCalculate} className="w-full bg-primary text-background py-2 rounded-lg font-semibold hover:bg-primary/90 transition">
                    {t("vips.calculate")}
                  </button>

                  {amount && (
                    <div className="mt-2">
                      {(() => {
                        const value = parseFloat(amount);
                        let vipTitle: string = t("vips.belowMinimum");
                        if (!isNaN(value) && value > 0) {
                          const p = findPlanByAmount(value);
                          if (p) vipTitle = p.title;
                        }
                        return (
                          <p className="text-foreground font-semibold">
                            {t("vips.qualifies")} <span className="text-primary font-bold">{vipTitle}</span>
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {results.map((res) => (
                        <p key={res.month} className="text-foreground font-medium">
                          {t("vips.afterMonths")} {res.month} month{res.month > 1 && "s"}:{" "}
                          <span className="text-primary font-bold">${res.total}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      )}

      {/* Live Activity */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mt-20 container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">{t("landing.liveActivity")}</h2>
        <div className="border border-muted/30 bg-card rounded-2xl shadow-lg overflow-hidden max-w-6xl mx-auto">
          <div className="grid grid-cols-3 text-center bg-primary/10 border-b border-muted/30 py-3 font-semibold text-primary text-lg">
            <span>{t("landing.userId")}</span>
            <span>{t("landing.deposit")}</span>
            <span>{t("landing.vipLevel")}</span>
          </div>
          <div className="divide-y divide-muted/20">
            {visibleUsers.map((userItem, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-3 text-center py-3 text-base font-medium">
                <span className="font-mono text-muted-foreground">{userItem.id}</span>
                <span className="text-green-500">{userItem.deposit}</span>
                <span className="text-primary">{userItem.vip}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* <CelebrationDialog open={celebrateOpen} onOpenChange={setCelebrateOpen} vipTitle={celebrateTitle} /> */}

      <style>
        {`
          @keyframes pulse-bright { 0%, 100% { box-shadow: 0 0 25px rgba(0, 212, 255, 0.4); } 50% { box-shadow: 0 0 45px rgba(0, 212, 255, 0.7); } }
          .animate-pulse-bright { animation: pulse-bright 2s infinite; }
          .drop-shadow-glow { filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.8)); }
        `}
      </style>
    </div>
  );
}
