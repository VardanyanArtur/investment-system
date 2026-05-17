/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import axiosInstance from "@/api/axiosInstance";
import { depositApi } from "@/api/api";
import { useWalletContext } from "@/contexts/WalletContext";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Wallet as WalletIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Send,
} from "lucide-react";

import { Usdt, Btc, Eth, Bnb, Matic, Trx, Sol, Avax } from "react-cryptocoins";

import logoBsc from "@/assets/chains/binance.svg";
import logoTron from "@/assets/chains/tron.svg";
import logoEthereum from "@/assets/chains/ethereum.svg";
import logoPolygon from "@/assets/chains/polygon.svg";
import logoArbitrum from "@/assets/chains/arbitrum.svg";
import logoOptimism from "@/assets/chains/optimism.svg";
import logoAvalanche from "@/assets/chains/avalanche.svg";
import logoSolana from "@/assets/chains/solana.svg";
import logoBitcoin from "@/assets/chains/bitcoin.svg";
import logoLightning from "@/assets/chains/lightning.svg";

import logoUSDC from "@/assets/tokens/usdc.svg";
import logoBUSD from "@/assets/tokens/busd.svg";

export type WithdrawValue =
  | "BEP20-USDT"
  | "BEP20-USDC"
  | "BEP20-BUSD"
  | "TRC20-USDT"
  | "ERC20-USDT"
  | "ERC20-USDC"
  | "ERC20-ETH"
  | "POLYGON-USDT"
  | "POLYGON-USDC"
  | "ARBITRUM-USDT"
  | "ARBITRUM-USDC"
  | "OPTIMISM-USDT"
  | "OPTIMISM-USDC"
  | "AVALANCHE-USDT"
  | "AVALANCHE-USDC"
  | "SOLANA-USDC"
  | "SOLANA-USDT"
  | "BITCOIN-BTC"
  | "LIGHTNING-BTC";

export interface CreateWithdrawBody {
  amountEarned: number;
  amountReferal: number;
  walletAddress: string;
  walletType: WithdrawValue;
}

export interface ApiOk<T> {
  success: true;
  data: T;
}
export interface ApiErr {
  success: false;
  message: string;
}

export type CreateWithdrawResp =
  | ApiOk<{ message: "Заявка на вывод создана" }>
  | ApiErr;

export interface WithdrawItem {
  _id: string;
  user: string;
  amountEarned: number;
  amountReferal: number;
  walletAddress: string;
  walletType: WithdrawValue;
  status: "pending" | "success" | "canceled";
  createdAt: string;
  updatedAt: string;
}

export interface MyWithdrawsRespOk {
  items: WithdrawItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
export type MyWithdrawsResp = ApiOk<MyWithdrawsRespOk> | ApiErr;

export type CancelWithdrawResp =
  | ApiOk<{ message: "Заявка отменена, средства возвращены" }>
  | ApiErr;

async function apiCreateWithdraw(body: CreateWithdrawBody): Promise<CreateWithdrawResp> {
  const { data } = await axiosInstance.post<CreateWithdrawResp>("/withdraw", body);
  return data;
}
async function apiGetMyWithdraws(
  page = 1,
  limit = 20,
  status?: "pending" | "success" | "canceled",
): Promise<MyWithdrawsResp> {
  const params: Record<string, any> = { page, limit };
  if (status) params.status = status;
  const { data } = await axiosInstance.get<MyWithdrawsResp>("/withdraw/my", { params });
  return data;
}
async function apiCancelWithdraw(id: string): Promise<CancelWithdrawResp> {
  const { data } = await axiosInstance.post<CancelWithdrawResp>(`/withdraw/${id}/cancel`);
  return data;
}

type HistoryItem = {
  _id: string;
  paymentId: number;
  priceAmount: number;
  status: "waiting" | "finished" | "failed" | "expired";
  invoiceUrl: string;
  createdAt: string;
};

type ChainKey =
  | "BSC"
  | "TRON"
  | "ETHEREUM"
  | "POLYGON"
  | "ARBITRUM"
  | "OPTIMISM"
  | "AVALANCHE"
  | "SOLANA"
  | "BITCOIN"
  | "LIGHTNING";

type TokenKey =
  | "USDT"
  | "USDC"
  | "BUSD"
  | "BTC"
  | "ETH"
  | "BNB"
  | "MATIC"
  | "TRX"
  | "SOL"
  | "AVAX";

const exchangeRates = { BTC: 45000, ETH: 3000, USDT: 1 };

const CHAIN_META: Record<ChainKey, { label: string; short: string; logo: string }> = {
  BSC: { label: "Binance Smart Chain", short: "BEP20", logo: logoBsc },
  TRON: { label: "Tron", short: "TRC20", logo: logoTron },
  ETHEREUM: { label: "Ethereum", short: "ERC20", logo: logoEthereum },
  POLYGON: { label: "Polygon", short: "Polygon", logo: logoPolygon },
  ARBITRUM: { label: "Arbitrum One", short: "Arbitrum", logo: logoArbitrum },
  OPTIMISM: { label: "Optimism", short: "Optimism", logo: logoOptimism },
  AVALANCHE: { label: "Avalanche C-Chain", short: "Avalanche", logo: logoAvalanche },
  SOLANA: { label: "Solana", short: "Solana", logo: logoSolana },
  BITCOIN: { label: "Bitcoin (On-chain)", short: "Bitcoin", logo: logoBitcoin },
  LIGHTNING: { label: "Bitcoin Lightning", short: "Lightning", logo: logoLightning },
};

const TOKEN_ICON: Record<TokenKey, (props: { className?: string }) => JSX.Element> = {
  USDT: (p) => <Usdt className={p.className ?? "h-5 w-5"} />,
  USDC: (p) => <img src={logoUSDC} className={p.className ?? "h-5 w-5"} alt="USDC" />,
  BUSD: (p) => <img src={logoBUSD} className={p.className ?? "h-5 w-5"} alt="BUSD" />,
  BTC: (p) => <Btc className={p.className ?? "h-5 w-5"} />,
  ETH: (p) => <Eth className={p.className ?? "h-5 w-5"} />,
  BNB: (p) => <Bnb className={p.className ?? "h-5 w-5"} />,
  MATIC: (p) => <Matic className={p.className ?? "h-5 w-5"} />,
  TRX: (p) => <Trx className={p.className ?? "h-5 w-5"} />,
  SOL: (p) => <Sol className={p.className ?? "h-5 w-5"} />,
  AVAX: (p) => <Avax className={p.className ?? "h-5 w-5"} />,
};

type WithdrawOption = { value: WithdrawValue; chain: ChainKey; token: TokenKey };

const WITHDRAW_OPTIONS: WithdrawOption[] = [
  { value: "BEP20-USDT", chain: "BSC", token: "USDT" },
  { value: "BEP20-USDC", chain: "BSC", token: "USDC" },
  { value: "BEP20-BUSD", chain: "BSC", token: "BUSD" },
  { value: "TRC20-USDT", chain: "TRON", token: "USDT" },
  { value: "ERC20-USDT", chain: "ETHEREUM", token: "USDT" },
  { value: "ERC20-USDC", chain: "ETHEREUM", token: "USDC" },
  { value: "ERC20-ETH", chain: "ETHEREUM", token: "ETH" },
  { value: "POLYGON-USDT", chain: "POLYGON", token: "USDT" },
  { value: "POLYGON-USDC", chain: "POLYGON", token: "USDC" },
  { value: "ARBITRUM-USDT", chain: "ARBITRUM", token: "USDT" },
  { value: "ARBITRUM-USDC", chain: "ARBITRUM", token: "USDC" },
  { value: "OPTIMISM-USDT", chain: "OPTIMISM", token: "USDT" },
  { value: "OPTIMISM-USDC", chain: "OPTIMISM", token: "USDC" },
  { value: "AVALANCHE-USDT", chain: "AVALANCHE", token: "USDT" },
  { value: "AVALANCHE-USDC", chain: "AVALANCHE", token: "USDC" },
  { value: "SOLANA-USDC", chain: "SOLANA", token: "USDC" },
  { value: "SOLANA-USDT", chain: "SOLANA", token: "USDT" },
  { value: "BITCOIN-BTC", chain: "BITCOIN", token: "BTC" },
  { value: "LIGHTNING-BTC", chain: "LIGHTNING", token: "BTC" },
];

const formatOptionLabel = (opt: WithdrawOption) => {
  const chain = CHAIN_META[opt.chain];
  const token = opt.token;
  const right =
    opt.chain === "BSC" ? "(Binance Smart Chain)" :
    opt.chain === "TRON" ? "(Tron)" :
    opt.chain === "ETHEREUM" ? "(Ethereum)" :
    opt.chain === "POLYGON" ? "(Polygon)" :
    opt.chain === "ARBITRUM" ? "(Arbitrum One)" :
    opt.chain === "OPTIMISM" ? "(Optimism)" :
    opt.chain === "AVALANCHE" ? "(Avalanche C-Chain)" :
    opt.chain === "SOLANA" ? "(Solana)" :
    opt.chain === "BITCOIN" ? "(On-chain)" :
    opt.chain === "LIGHTNING" ? "(Lightning)" :
    "";
  return `${chain.short} — ${token} ${right}`;
};

const NetworkOptionRow = ({ opt }: { opt: WithdrawOption }) => {
  const chain = CHAIN_META[opt.chain];
  const label = formatOptionLabel(opt);
  const TokenIcon = TOKEN_ICON[opt.token];

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <img src={chain.logo} alt={chain.label} className="h-6 w-6 rounded-md ring-1 ring-border/50" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium sm:text-base">{label}</span>
          <span className="text-xs text-muted-foreground">{chain.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <TokenIcon className="h-5 w-5 opacity-90" />
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">{opt.token}</span>
      </div>
    </div>
  );
};

const GroupHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
    {children}
  </div>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallet, loading: walletLoading, refreshWallet } = useWalletContext();

  const [amount, setAmount] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  const [withdrawValue, setWithdrawValue] = useState<WithdrawValue | "">("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawTotalAmount, setWithdrawTotalAmount] = useState<string>("");
  const [withdrawing, setWithdrawing] = useState(false);

  const [wdItems, setWdItems] = useState<WithdrawItem[]>([]);
  const [wdLoading, setWdLoading] = useState<boolean>(false);

  const totalValue = useMemo(() => {
    if (!wallet) return 0;
    return (
      Number(wallet.depositBalance || 0) +
      Number(wallet.earnedBalance || 0) +
      Number(wallet.referralBalance || 0)
    );
  }, [wallet]);

  const availableToWithdraw = useMemo(() => {
    if (!wallet) return 0;
    return Math.max(
      0,
      Number(wallet.earnedBalance || 0) + Number(wallet.referralBalance || 0),
    );
  }, [wallet]);

  const split = useMemo(() => {
    const total = Number(withdrawTotalAmount) || 0;
    const earnedBal = Number(wallet?.earnedBalance || 0);
    const refBal = Number(wallet?.referralBalance || 0);

    if (total === 0) return { amountEarned: 0, amountReferal: 0, error: "" };
    if (total < 2) return { amountEarned: 0, amountReferal: 0, error: "Minimum withdrawal is 2 (1 from earned + 1 from referral)" };
    if (earnedBal < 1) return { amountEarned: 0, amountReferal: 0, error: "Insufficient earned balance (need at least 1)" };
    if (total > earnedBal + refBal) return { amountEarned: 0, amountReferal: 0, error: `Insufficient total funds. Max ${earnedBal + refBal}` };

    let amountReferal = 1;
    let amountEarned = total - amountReferal;

    if (amountEarned > earnedBal) {
      const deficit = amountEarned - earnedBal;
      amountEarned = earnedBal;
      amountReferal += deficit;
    }

    if (amountReferal > refBal) {
      const over = amountReferal - refBal;
      const canTakeFromEarned = earnedBal - amountEarned;
      if (canTakeFromEarned >= over) {
        amountEarned += over;
        amountReferal -= over;
      } else {
        return { amountEarned: 0, amountReferal: 0, error: "Insufficient referral balance for this amount" };
      }
    }

    if (amountEarned < 1) {
      const need = 1 - amountEarned;
      if (amountReferal - need >= 1) {
        amountEarned = 1;
        amountReferal -= need;
      } else {
        return { amountEarned: 0, amountReferal: 0, error: "Cannot satisfy minimum 1 from earned" };
      }
    }
    if (amountEarned > earnedBal) return { amountEarned: 0, amountReferal: 0, error: "Insufficient earned balance" };
    if (amountReferal > refBal) return { amountEarned: 0, amountReferal: 0, error: "Insufficient referral balance" };
    if (amountEarned + amountReferal !== total) {
      return { amountEarned: 0, amountReferal: 0, error: "Split mismatch" };
    }

    return { amountEarned, amountReferal, error: "" };
  }, [withdrawTotalAmount, wallet]);

  const fetchDepositHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await depositApi.getHistory(30);
      setHistory(res.success ? res.deposits : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchMyWithdraws = async () => {
    try {
      setWdLoading(true);
      const res = await apiGetMyWithdraws(1, 20);
      if (res.success) setWdItems(res.data.items);
      else setWdItems([]);
    } catch {
      setWdItems([]);
    } finally {
      setWdLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositHistory();
    fetchMyWithdraws();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const createDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt < 1) {
      toast({ title: "Invalid amount", description: "Please enter amount ≥ 1" });
      return;
    }

    try {
      setCreating(true);
      const res = await depositApi.create(amt);
      if (res?.success) {
        setInvoiceUrl(res.data.invoiceUrl);
        setPaymentId(res.data.invoiceId);
        setInvoiceOpen(true);
        await Promise.all([refreshWallet(), fetchDepositHistory()]);
        toast({ title: t("dashboard.depositCreated"), description: t("dashboard.invoiceReady") });
      } else {
        toast({ title: t("dashboard.depositFailed"), description: res?.message || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: t("dashboard.requestError"), description: err?.response?.data?.message || String(err), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const submitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = Number(withdrawTotalAmount);
    const earnedBal = Number(wallet?.earnedBalance || 0);
    const refBal = Number(wallet?.referralBalance || 0);

    if (!withdrawValue) {
      toast({ title: "Select a network", description: "Choose a withdrawal network + asset.", variant: "destructive" });
      return;
    }
    if (!withdrawAddress.trim()) {
      toast({ title: "Wallet address required", description: "Paste your destination wallet address.", variant: "destructive" });
      return;
    }
    if (!total || total < 2) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is 2 (1 from earned + 1 from referral).", variant: "destructive" });
      return;
    }
    if (earnedBal < 1) {
      toast({ title: "Insufficient balances", description: "You must have at least $1 in earned.", variant: "destructive" });
      return;
    }
    if (total > earnedBal + refBal) {
      toast({
        title: "Amount exceeds available",
        description: `Max you can withdraw is ${(wallet?.currency || "USD")} ${(earnedBal + refBal).toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }
    if (split.error) {
      toast({ title: "Split error", description: split.error, variant: "destructive" });
      return;
    }

    const { amountEarned, amountReferal } = split as { amountEarned: number; amountReferal: number; error?: string };

    const payload: CreateWithdrawBody = {
      amountEarned,
      amountReferal,
      walletAddress: withdrawAddress.trim(),
      walletType: withdrawValue as WithdrawValue,
    };

    try {
      setWithdrawing(true);
      const res = await apiCreateWithdraw(payload);
      if (!res.success) throw new Error("Withdraw failed");

      localStorage.setItem(`wallet_address_${withdrawValue}`, withdrawAddress.trim());

      toast({ title: "Withdrawal requested", description: "Your request is created and pending review." });

      setWithdrawTotalAmount("");
      setWithdrawAddress("");
      await Promise.all([refreshWallet(), fetchMyWithdraws()]);
    } catch (err: any) {
      toast({
        title: "Withdrawal failed",
        description: err?.response?.data?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCancelWithdraw = async (id: string) => {
    try {
      const res = await apiCancelWithdraw(id);
      if (!res.success) throw new Error("Cancel failed");
      toast({ title: "Withdraw canceled", description: "Funds returned to your balances." });
      await Promise.all([refreshWallet(), fetchMyWithdraws()]);
    } catch (err: any) {
      toast({
        title: "Cancel failed",
        description: err?.response?.data?.message || String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen px-4 pb-12 pt- sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 transition-colors hover:text-red-600 sm:text-base"
          >
            {t("dashboard.logout")}
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("dashboard.welcome")}, {user?.name || "User"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("dashboard.managePortfolio")}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="group relative overflow-hidden border border-primary/20 bg-card p-6 transition-all hover:border-primary/60 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">{t("dashboard.totalBalance")}</h3>
                <WalletIcon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-primary">{totalValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                ≈ {(totalValue / exchangeRates.BTC).toFixed(4)} BTC
              </p>
            </Card>

           
          </div>

          <Tabs defaultValue="deposit" className="mt-7 w-full">
            <TabsList className="grid w-full grid-cols-2 gap-2 rounded-lg border border-primary/20 bg-card p-0 sm:grid-cols-2">
              <TabsTrigger
                value="deposit"
                className="w-full rounded-md px-3 py-1 text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary sm:text-base"
              >
                {t("dashboard.deposit")}
              </TabsTrigger>
          
              <TabsTrigger
                value="withdraw"
                className="w-full rounded-md px-3 py-1 text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary sm:text-base"

              >
                {t("dashboard.withdraw")}
              </TabsTrigger>
             
            </TabsList>

            <TabsContent value="deposit" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {walletLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border border-primary/20 bg-card p-6">
                      <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted/60" />
                      <div className="h-8 w-40 animate-pulse rounded bg-muted/60" />
                    </Card>
                  ))
                ) : (
                  <>
                    <Card className="border border-primary/20 bg-card p-6 shadow-sm">
                      <h3 className="text-sm text-muted-foreground">{t("dashboard.depositBalance")}</h3>
                      <p className="mt-2 text-2xl font-semibold text-primary">
                        {wallet?.currency || "USD"} {Number(wallet?.depositBalance || 0).toLocaleString()}
                      </p>
                    </Card>
                    <Card className="border border-primary/20 bg-card p-6 shadow-sm">
                      <h3 className="text-sm text-muted-foreground">{t("dashboard.earnedBalance")}</h3>
                      <p className="mt-2 text-2xl font-semibold text-primary">
                        {wallet?.currency || "USD"} {Number(wallet?.earnedBalance || 0).toLocaleString()}
                      </p>
                    </Card>
                    <Card className="border border-primary/20 bg-card p-6 shadow-sm">
                      <h3 className="text-sm text-muted-foreground">{t("dashboard.referralBalance")}</h3>
                      <p className="mt-2 text-2xl font-semibold text-primary">
                        {wallet?.currency || "USD"} {Number(wallet?.referralBalance || 0).toLocaleString()}
                      </p>
                    </Card>
                  </>
                )}
              </div>

              <Card className="border border-primary/20 bg-card p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">{t("dashboard.depositFunds")}</h2>
                </div>
                <form onSubmit={createDeposit} className="mt-5 grid max-w-xl gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">{t("dashboard.amountUSD")}</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={1}
                      step="1"
                      placeholder={t("dashboard.enterAmount")}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={creating} className="h-12">
                      {creating ? t("dashboard.creating") : t("dashboard.createInvoice")}
                    </Button>
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      You’ll get an invoice link — complete payment to receive balance + bonuses.
                    </span>
                  </div>
                </form>
              </Card>

              <Card className="border border-primary/20 bg-card p-6">
                <h2 className="text-2xl font-semibold">{t("dashboard.depositHistory")}</h2>
                <div className="mt-4 space-y-3">
                  {historyLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-md border border-primary/10 bg-muted/30" />
                    ))
                  ) : history?.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t("dashboard.noDeposits")}</div>
                  ) : (
                    history?.map((tx) => (
                      <div
                        key={tx._id}
                        className="flex flex-col gap-3 rounded-lg border border-primary/10 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium">{t("dashboard.paymentNumber")}{tx.paymentId}</div>
                          <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {tx.priceAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                            </div>
                          </div>
                          <Badge
                            variant={
                              tx.status === "finished"
                                ? "default"
                                : tx.status === "waiting"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {t(`dashboard.status.${tx.status}`)}
                          </Badge>
                          <a
                            href={tx.invoiceUrl}
                            className="text-sm font-medium text-primary underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("dashboard.invoice")}
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6 space-y-6">
              <Card className="border border-primary/20 bg-card p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <ArrowDownRight className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">{t("dashboard.withdrawToWallet") || "Withdraw to Wallet"}</h2>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card className="border border-primary/20 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("dashboard.totalBalance")}</div>
                    <div className="mt-2 text-xl font-semibold">
                      {wallet?.currency || "USD"} {totalValue.toLocaleString()}
                    </div>
                  </Card>
                  <Card className="border border-primary/20 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("dashboard.earnedBalance")}</div>
                    <div className="mt-2 text-xl font-semibold">
                      {wallet?.currency || "USD"} {Number(wallet?.earnedBalance || 0).toLocaleString()}
                    </div>
                  </Card>
                  <Card className="border border-primary/20 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("dashboard.availableToWithdraw") ?? "Available to withdraw"}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xl font-semibold">
                        {wallet?.currency || "USD"} {availableToWithdraw.toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="whitespace-nowrap text-xs">
                        earned + referral
                      </Badge>
                    </div>
                  </Card>
                </div>

                <form onSubmit={submitWithdraw} className="mt-6 grid max-w-2xl gap-5">
                  <div className="grid gap-2">
                    <Label className="text-sm sm:text-base">Network & Asset</Label>
                    <Select
                      value={withdrawValue}
                      onValueChange={(v) => {
                        setWithdrawValue(v as WithdrawValue);
                        const savedAddress = localStorage.getItem(`wallet_address_${v}`);
                        if (savedAddress) setWithdrawAddress(savedAddress);
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-xl border border-border/70 bg-card/70 px-4 text-sm sm:text-base">
                        <SelectValue placeholder="Select network (e.g. BEP20 — USDT)" />
                      </SelectTrigger>

                      <SelectContent
                        className="z-50 max-h-[360px] w-[min(92vw,720px)] overflow-y-auto rounded-xl border border-border/70 bg-popover/95 p-1 shadow-xl backdrop-blur"
                        position="popper"
                        sideOffset={8}
                        align="start"
                      >
                        <GroupHeader>Binance Smart Chain</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "BSC").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Tron</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "TRON").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Ethereum</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "ETHEREUM").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Polygon</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "POLYGON").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Arbitrum</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "ARBITRUM").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Optimism</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "OPTIMISM").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Avalanche</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "AVALANCHE").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Solana</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => o.chain === "SOLANA").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                        <div className="my-1 h-px w-full bg-border/60" />

                        <GroupHeader>Bitcoin</GroupHeader>
                        {WITHDRAW_OPTIONS.filter((o) => ["BITCOIN", "LIGHTNING"].includes(o.chain)).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-lg px-3 py-3 text-sm transition-colors data-[highlighted]:bg-accent/70 data-[state=checked]:bg-primary/15">
                            <NetworkOptionRow opt={opt} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {split.error ? (
                        <span className="font-medium text-red-500">{split.error}</span>
                      ) : (
                        <>
                          Will take <span className="font-semibold">{wallet?.currency || "USD"} {split.amountEarned.toLocaleString()}</span> from <span className="font-semibold">earned</span> and{" "}
                          <span className="font-semibold">{wallet?.currency || "USD"} {split.amountReferal.toLocaleString()}</span> from <span className="font-semibold">referral</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="wd-address">Destination Address</Label>
                    <Input
                      id="wd-address"
                      placeholder="Paste your wallet (e.g. Binance) address"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      className="h-12 text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="wd-total">{`Total Amount (${wallet?.currency || "USD"})`}</Label>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        Max: {wallet?.currency || "USD"} {availableToWithdraw.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="wd-total"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={withdrawTotalAmount}
                        onChange={(e) => setWithdrawTotalAmount(e.target.value)}
                        className="h-12 text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setWithdrawTotalAmount(String(availableToWithdraw))}
                        className="h-12 shrink-0 sm:w-auto"
                      >
                        Use Max
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={withdrawing} className="h-12 px-6">
                      {withdrawing ? "Requesting..." : "Request Withdrawal"}
                    </Button>
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      Withdrawals are processed to your selected network address.
                    </span>
                  </div>
                </form>
              </Card>

              <Card className="border border-primary/20 bg-card p-6">
                <h2 className="text-2xl font-semibold">My Withdrawals</h2>
                <div className="mt-4 space-y-3">
                  {wdLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-md border border-primary/10 bg-muted/30" />
                    ))
                  ) : wdItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No withdrawals yet.</div>
                  ) : (
                    wdItems.map((w) => (
                      <div
                        key={w._id}
                        className="flex flex-col gap-3 rounded-lg border border-primary/10 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="secondary" className="text-xs sm:text-sm">{w.walletType}</Badge>
                          <div className="text-sm font-semibold sm:text-base">
                            {(wallet?.currency || "USD")} {(w.amountEarned + w.amountReferal).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <div className="text-xs text-muted-foreground sm:text-right">
                            <div>{new Date(w.createdAt).toLocaleString()}</div>
                            <div>Split: earned {w.amountEarned} + referral {w.amountReferal}</div>
                          </div>
                          <Badge
                            variant={
                              w.status === "success"
                                ? "default"
                                : w.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="self-start sm:self-center"
                          >
                            {w.status}
                          </Badge>
                          {w.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => handleCancelWithdraw(w._id)}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

  
          </Tabs>
        </motion.div>
      </div>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.invoiceCreated")}</DialogTitle>
            <DialogDescription>{t("dashboard.invoiceUseLink")}</DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-primary/20 bg-muted/30 p-3 text-sm break-all">{invoiceUrl}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {t("dashboard.paymentId")}: {paymentId ?? "-"}
          </div>

          <DialogFooter className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(invoiceUrl)}>
              {t("dashboard.copyLink")}
            </Button>
            <Button type="button" onClick={() => (window.location.href = invoiceUrl)}>
              {t("dashboard.openInvoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}