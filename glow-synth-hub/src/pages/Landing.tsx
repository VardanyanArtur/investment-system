// src/pages/Landing.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";
import { Lock, Unlock, Shield, Zap, TrendingUp, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useVipPlans, type VipPlan } from "@/hooks/useVipPlans";
import { useWallet } from "@/hooks/useWallet";
import { vipApi } from "@/api/api";
import CelebrationDialog from "@/components/CelebrationDialog";

const iconsMap: Record<string, React.ComponentType<any>> = { Shield, Zap, TrendingUp, Star };

export default function Landing() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [vips, setVips] = useState<VipPlan[]>([]);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [celebrateTitle, setCelebrateTitle] = useState("");

  // remote data
  const { data: vipPlans, loading: plansLoading, error: plansError } = useVipPlans();
  const { data: wallet, loading: walletLoading, error: walletError } = useWallet({ token, enabled: Boolean(user) });

  
  // total balance from wallet
  const totalBalance = useMemo(() => {
    if (!wallet) return 0;
    const { depositBalance = 0, earnedBalance = 0, referralBalance = 0 } = wallet;
    return (depositBalance || 0) + (earnedBalance || 0) + (referralBalance || 0);
  }, [wallet]);

  // unlocked plan index
  const unlockedIndex = useMemo(() => {
    const list = vips.length ? vips : vipPlans;
    if (!user || !list.length) return -1;
    let idx = -1;
    for (let i = 0; i < list.length; i++) {
      const plan = list[i];
      const fits = wallet?.depositBalance >= plan.min && (plan.max == null || wallet?.depositBalance <= plan.max);
      if (fits) idx = i;
    }
    return idx;
  }, [user, vipPlans, vips, wallet?.depositBalance]);

  // detect level-up
  const prevUnlocked = useRef<number>(-1);
  useEffect(() => {
    if (user && unlockedIndex > prevUnlocked.current) {
      const plan = (vips.length ? vips : vipPlans)[unlockedIndex];
      if (plan) {
        setCelebrateTitle(plan.title);
        setCelebrateOpen(true);
      }
    }
    prevUnlocked.current = unlockedIndex;
  }, [unlockedIndex, user, vipPlans, vips]);

  // fetch vips via vipApi too (if you want to keep local vips array)
  useEffect(() => {
    const getData = async () => {
      try {
        const data = await vipApi.getVipPlans();
        setVips(data);
      } catch {
        setVips([]);
      }
    };
    getData();
  }, []);

  // showcase users
  const [startIndex, setStartIndex] = useState(0);
  const usersShowcase = useMemo(() => {
    const list = vips.length ? vips : vipPlans;
    const generateRandomUsers = (count = 20) => {
      const randomId = () => `1${Math.floor(100000 + Math.random() * 899999).toString().replace(/(\d{2})\d{2}(\d{2})/, "$1****$2")}`;
      const randomDeposit = () => `+${Math.floor(100 + Math.random() * 6900)}$`;
      const randomVIP = () => {
        if (!list.length) return "VIP 1";
        return list[Math.floor(Math.random() * list.length)].title;
      };
      return Array.from({ length: count }, () => ({ id: randomId(), deposit: randomDeposit(), vip: randomVIP() }));
    };
    return generateRandomUsers(20);
  }, [vipPlans, vips]);

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
          {t("landing.title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("landing.subtitle")}</p>

        {user && (
          <div className="mt-4 text-muted-foreground">
            <span className="font-semibold">{t("landing.yourBalance") || "Your balance"}:</span>{" "}
            <span className="text-primary font-bold">${totalBalance.toLocaleString()}</span>
          </div>
        )}

        {anyError && <div className="mt-3 text-sm text-red-500">{anyError}</div>}
      </motion.div>

      {anyLoading ? (
        <div className="min-h-[200px] flex justify-center items-center text-2xl font-semibold">Loading...</div>
      ) : (
        <>
          {/* VIP Cards */}
          <div className="container mx-auto px-6 grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {(vips.length ? vips : vipPlans).map((plan: VipPlan, index: number) => {
              const isUnlocked = index === unlockedIndex && Boolean(user);
              const Icon = iconsMap[plan.icon] || Shield;

              return (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: plan.delay, duration: 0.6 }}
                  className={`relative p-6 rounded-2xl text-center flex flex-col justify-between transition-all duration-300 
                    ${isUnlocked ? "border-2 border-primary bg-gradient-to-b from-primary/10 via-primary/5 to-background shadow-[0_0_30px_5px_rgba(0,212,255,0.3)] animate-pulse-bright" : "border border-muted/30 bg-card opacity-70 hover:opacity-90"}`}
                >
                  <div className="absolute top-4 right-4">
                    {isUnlocked ? <Unlock className="h-7 w-7 text-primary drop-shadow-glow animate-bounce" /> : <Lock className="h-6 w-6 text-muted-foreground" />}
                  </div>

                  <Icon className={`h-12 w-12 mx-auto mb-4 ${isUnlocked ? "text-primary drop-shadow-glow" : "text-muted-foreground"}`} />
                  <h2 className={`text-2xl font-bold mb-2 ${isUnlocked ? "text-primary" : "text-foreground"}`}>{plan.title}</h2>

                  <p className="text-lg text-muted-foreground mb-2 font-medium">
                    {plan.max ? `$${plan.min.toLocaleString()} - $${plan.max.toLocaleString()}` : `$${plan.min.toLocaleString()}+`}
                  </p>
                  <p className={`text-xl font-semibold mb-2 ${isUnlocked ? "text-secondary" : "text-muted-foreground"}`}>{plan.daily}</p>
                  <p className="text-muted-foreground">
                    {t("landing.cashback")}: <span className="text-primary font-bold">{plan.cashback}</span>
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Users table */}
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mt-20 container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-8 text-primary">{t("landing.liveActivity")}</h2>
            <div className="border border-muted/30 bg-card rounded-2xl shadow-lg overflow-hidden max-w-6xl mx-auto">
              <div className="grid grid-cols-3 text-center bg-primary/10 border-b border-muted/30 py-3 font-semibold text-primary text-lg">
                <span>{t("landing.userId")}</span>
                <span>{t("landing.deposit")}</span>
                <span>{t("landing.vipLevel")}</span>
              </div>
              <div className="divide-y divide-muted/20">
                {visibleUsers.map((u, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-3 text-center py-3 text-base font-medium">
                    <span className="font-mono text-muted-foreground">{u.id}</span>
                    <span className="text-green-500">{u.deposit}</span>
                    <span className="text-primary">{u.vip}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Celebration */}
      {/* <CelebrationDialog open={celebrateOpen} onOpenChange={setCelebrateOpen} vipTitle={celebrateTitle} /> */}

      {/* glow styles */}
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
