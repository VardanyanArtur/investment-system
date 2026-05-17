// src/pages/DailyBonusPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { useVipPlans, type VipPlan } from "@/hooks/useVipPlans";
import { gameApi } from "@/api/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import CelebrationDialog2 from "@/components/CelebrationDialog2";

type HistoryRow = {
  _id: string;
  amount: number;
  date: string;
  vipPlan?: { _id: string; title: string; daily: string };
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parsePercent(daily: string) {
  const m = String(daily).match(/([\d.,]+)/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(",", "."));
  return isFinite(n) ? n / 100 : 0;
}

function formatCountdownWords(totalMs: number) {
  const totalSecs = Math.max(0, Math.floor(totalMs / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function DailyBonusPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Wallet (context-backed) + ability to refresh app-wide
  const { data: wallet, loading: walletLoading, refetch: refetchWallet } = useWallet({
    token,
    enabled: Boolean(user),
  });
  const { refreshWallet } = useWalletContext();

  // VIP plans (to compute daily percent + unlocked tier)
  const { data: vipPlans, loading: plansLoading } = useVipPlans();

  // History paging
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Claiming + dialogs
  const [claiming, setClaiming] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState("");

  // VIP unlock celebration (if claim bumps the tier)
  const [vipCelebrateOpen, setVipCelebrateOpen] = useState(false);
  const [vipCelebrateTitle, setVipCelebrateTitle] = useState("");
  const prevUnlockedRef = useRef<number>(-1);

  // Live clock for countdown updates
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalDeposit = Number(wallet?.depositBalance || 0);
  const totalEarned = Number(wallet?.earnedBalance || 0);
  const totalReferral = Number(wallet?.referralBalance || 0);
  const totalBalance = totalDeposit + totalEarned + totalReferral;

  // current VIP based on deposit balance
  const currentVip: VipPlan | null = useMemo(() => {
    if (!vipPlans?.length) return null;
    return (
      vipPlans.find((p) => totalDeposit >= p.min && (p.max == null || totalDeposit <= p.max)) ||
      null
    );
  }, [vipPlans, totalDeposit]);

  const dailyPct = currentVip ? parsePercent(currentVip.daily) : 0;
  const expectedBonus = Math.max(0, totalDeposit * dailyPct);

  // unlocked VIP index (by totalBalance like your app)
  const unlockedIndex = useMemo(() => {
    if (!vipPlans?.length || !user) return -1;
    let idx = -1;
    for (let i = 0; i < vipPlans.length; i++) {
      const p = vipPlans[i];
      const fits = totalBalance >= p.min && (p.max == null || totalBalance <= p.max);
      if (fits) idx = i;
    }
    return idx;
  }, [vipPlans, totalBalance, user]);

  useEffect(() => {
    if (prevUnlockedRef.current === -1) prevUnlockedRef.current = unlockedIndex;
  }, [unlockedIndex]);

  // === 24h COOLDOWN LOGIC ===
  // local override for instant UI switch after success (no flicker)
  const [lastClaimOverrideMs, setLastClaimOverrideMs] = useState<number | null>(null);

  const lastClaimMs =
    lastClaimOverrideMs ??
    (wallet?.lastDailyBonusAt ? new Date(wallet.lastDailyBonusAt).getTime() : null);

  const nextClaimMs = lastClaimMs ? lastClaimMs + DAY_MS : null;
  const msUntilNext = nextClaimMs ? nextClaimMs - now.getTime() : 0;
  const canClaim = !!currentVip && (!lastClaimMs || now.getTime() >= (nextClaimMs ?? 0));

  // keep override only until server value catches up
  useEffect(() => {
    if (!wallet?.lastDailyBonusAt) return;
    const serverMs = new Date(wallet.lastDailyBonusAt).getTime();
    if (lastClaimOverrideMs && serverMs >= lastClaimOverrideMs) {
      setLastClaimOverrideMs(null);
    }
  }, [wallet?.lastDailyBonusAt, lastClaimOverrideMs]);

  // Bonus history
  const loadHistory = async (p = 1) => {
    try {
      setHistoryLoading(true);
      const res = await gameApi.history(p, 10);
      if (res.success) {
        setHistory(res.history);
        setTotalPages(res.totalPages);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // celebrate on VIP level up after wallet refresh
  useEffect(() => {
    if (user && prevUnlockedRef.current >= 0 && unlockedIndex > prevUnlockedRef.current) {
      const plan = vipPlans?.[unlockedIndex];
      if (plan) {
        setVipCelebrateTitle(plan.title);
        setVipCelebrateOpen(true);
      }
    }
    prevUnlockedRef.current = unlockedIndex;
  }, [unlockedIndex, user, vipPlans]);

  const claim = async () => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    if (!currentVip) {
      toast({
        title: "No VIP",
        description: "Deposit to unlock a VIP tier first.",
        variant: "destructive",
      });
      return;
    }
    if (!canClaim) {
      toast({
        title: "Too early",
        description: "You can claim again when the countdown ends.",
        variant: "destructive",
      });
      return;
    }

    try {
      setClaiming(true);

      const res = await gameApi.claimDaily();
      if (!res.success) {
        toast({
          title: "Claim failed",
          description: (res as any)?.message || "Server rejected claim",
          variant: "destructive",
        });
        return;
      }

      // Success dialog
      setSuccessText(
        `You received $${res.bonus.toFixed(2)} from ${res.vip.title} (${res.vip.daily}).`
      );
      setSuccessOpen(true);

      // Optimistic: instantly start 24h cooldown
      setLastClaimOverrideMs(Date.now());

      // Refresh wallet + history across the app
      await Promise.all([refreshWallet(), refetchWallet(), loadHistory(1)]);
      setPage(1);
    } catch (e: any) {
      toast({
        title: "Claim error",
        description: e?.response?.data?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  const anyLoading = plansLoading || (user && walletLoading);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/50 to-background pt-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          {t("missions.title") || "Daily VIP Bonus"}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("missions.subtitle") ||
            "Claim your daily VIP reward. A new claim becomes available exactly 24 hours after your last claim."}
        </p>
      </motion.div>

      {/* Main */}
      {anyLoading ? (
        <div className="min-h-[200px] flex justify-center items-center text-2xl font-semibold">
          {t("common.loading")}
        </div>
      ) : (
        <div className="container mx-auto px-6 grid lg:grid-cols-3 gap-8">
          {/* Left: VIP & expected bonus */}
          <Card className="p-6 bg-card border border-muted/30 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-primary">{t("missions.vipBonus")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("missions.depositBalance")}</span>
                <span className="font-semibold">${totalDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("missions.earnedBalance")}</span>
                <span className="font-semibold">${totalEarned.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("missions.referralBalance")}</span>
                <span className="font-semibold">${totalReferral.toLocaleString()}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("missions.currentVip")}</span>
                <Badge variant={currentVip ? "default" : "secondary"}>
                  {currentVip ? currentVip.title : t("missions.noVip")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("missions.dailyPercent")}</span>
                <span className="font-semibold">{currentVip?.daily || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("missions.expectedBonus")}</span>
                <span className="font-bold text-primary">${expectedBonus.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {t("missions.bonusFormula")}
            </p>
          </Card>

          {/* Middle: Claim card with 24h cooldown */}
          <Card className="p-6 bg-card border border-muted/30 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-primary">{t("missions.claimStatus")}</h2>

            {/* Status + dynamic countdown text */}
            <div
              className={`mb-4 rounded-md border p-3 font-medium ${
                canClaim ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
              }`}
            >
              {canClaim
                ? t("missions.readyToClaim")
                : `${t("missions.nextBonusIn")}: ${formatCountdownWords(msUntilNext)}`}
            </div>

            <Button
              className="w-full"
              onClick={claim}
              disabled={!currentVip || !canClaim || claiming}
            >
              {claiming
                ? t("missions.claiming")
                : currentVip
                ? canClaim
                  ? t("missions.claimButton")
                  : t("missions.availableAfterCooldown")
                : t("missions.depositToUnlock")}
            </Button>

            {!currentVip && (
              <p className="text-xs text-muted-foreground mt-3">
                {t("missions.needDeposit")}
              </p>
            )}

            {lastClaimMs && (
              <p className="text-xs text-muted-foreground mt-3">
                {t("missions.lastClaimedAt")}: {new Date(lastClaimMs).toLocaleString()}
              </p>
            )}
          </Card>

          {/* Right: History */}
          <Card className="p-6 bg-card border border-muted/30 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-primary">{t("missions.bonusHistory")}</h2>

            {historyLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-md border p-3 bg-muted/40 animate-pulse h-16" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("missions.noBonusYet")}</div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h._id} className="rounded-md border p-3 bg-muted/40">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">${h.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.date).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {h.vipPlan?.title ? `VIP: ${h.vipPlan.title} (${h.vipPlan.daily})` : "VIP: -"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {t("missions.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("missions.page")} {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {t("missions.next")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Success modal */}
      <CelebrationDialog2
        open={successOpen}
        onOpenChange={setSuccessOpen}
        title={t("missions.bonusClaimed")}
        description={successText}
      />

      {/* VIP unlock celebration (if the claim raised the tier) */}
      <CelebrationDialog2
        open={vipCelebrateOpen}
        onOpenChange={setVipCelebrateOpen}
        title={t("missions.vipLevelUp")}
        description={`${t("missions.youAreNow")} ${vipCelebrateTitle}. ${t("missions.enjoyBenefits")}`}
      />
    </div>
  );
}
