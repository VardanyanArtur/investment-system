import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { userApi } from "@/api/api";

// ===== CONFIG =====
const RESEND_SECONDS = 60;

// ===== COMPONENT =====
export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Modal (verify)
  const [showModal, setShowModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  // OTP state: 6 inputs
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  // Resend code timer
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const timerRunning = secondsLeft > 0;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const refCode = searchParams.get("ref") || undefined;

  // Handle field changes
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const data = await userApi.register(form);

      if (!data.success) {
        throw new Error(data.message || "Registration failed");
      }

      // Open verify modal
      setShowModal(true);
      setSecondsLeft(RESEND_SECONDS);
      setOtpValues(["", "", "", "", "", ""]);

      // toast: код отправлен
      toast({ description: t("auth.codeSent") });

      // focus first input (после рендера)
      setTimeout(() => inputsRef.current[0]?.focus(), 60);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response.data.message || t("auth.registerError"));
      toast({ description: err.response.data.message || t("auth.registerError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // TIMER: resend countdown
  useEffect(() => {
    if (!showModal) return;
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, showModal]);

  // OTP helpers
  const setDigit = (index, value) => {
    setOtpValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOtpChange = (index, v) => {
    const val = v.replace(/\D/g, "").slice(0, 1);
    if (!val) {
      setDigit(index, "");
      return;
    }
    setDigit(index, val);
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    } else {
      inputsRef.current[index]?.blur();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        setDigit(index - 1, "");
        inputsRef.current[index - 1]?.focus();
      } else {
        setDigit(index, "");
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = text.split("");
    while (next.length < 6) next.push("");
    setOtpValues(next.slice(0, 6));
    const lastIndex = Math.min(text.length, 6) - 1;
    inputsRef.current[lastIndex >= 0 ? lastIndex : 0]?.focus();
  };

  const otpCode = otpValues.join("");
  const isOtpComplete = otpCode.length === 6 && /^\d{6}$/.test(otpCode);

  // VERIFY
  const handleVerify = async () => {
    if (!isOtpComplete) {
      setVerifyError(t("auth.enter6Digit"));
      toast({ description: t("auth.enter6Digit"), variant: "destructive" });
      return;
    }
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const data = await userApi.verify({ email: form.email, code: otpCode });
      if (!data.success) {
        throw new Error(data.message || "Verification failed");
      }

      toast({ description: t("auth.emailVerified") });
      setShowModal(false);
      navigate("/login");
    } catch (err) {
      console.error(err.response?.data?.message || err.response.data || err);
      setVerifyError(err.message || t("auth.verificationError"));
      toast({ description: err.message || t("auth.verificationError"), variant: "destructive" });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = () => {
    if (timerRunning) return;
    console.log("Resend verification code to:", form.email);
    toast({ description: t("auth.resendCode") });
    setSecondsLeft(RESEND_SECONDS);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background/70 to-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md bg-card border border-muted/30 rounded-3xl shadow-xl p-8"
      >
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-8">
          {t("auth.createAccount") || "Create account"}
        </h1>

        {submitError && (
          <p className="text-red-500 bg-red-100 p-2 rounded-md mb-4 text-center">
            {submitError}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Name */}
          <div>
            <Label className="mb-2 block">{t("auth.name") || "Name"}</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-xl bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="mb-2 block">{t("auth.email") || "Email"}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                name="email"
                placeholder={t("auth.emailPlaceholder") || "you@example.com"}
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-xl bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label className="mb-2 block">{t("auth.password") || "Password"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-xl bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (t("auth.loading") || "Loading...") : (t("auth.register") || "Register")}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.alreadyHaveAccount") || "Already have an account?"}{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t("auth.login") || "Log in"}
          </Link>
        </p>
      </motion.div>

      {/* VERIFY MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent">
          {/* Slide-up + fade container */}
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-card rounded-2xl border border-muted/30 shadow-2xl p-6"
          >
            <DialogHeader className="mb-2">
              <DialogTitle className="text-xl">
                {t("auth.verifyEmail")}
              </DialogTitle>
              <DialogDescription>
                {t("auth.enterCode")} {form.email}
              </DialogDescription>
            </DialogHeader>

            {/* OTP Inputs */}
            <div className="flex items-center justify-center gap-2 my-4">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-semibold rounded-xl border border-muted/40 bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              ))}
            </div>

            {verifyError && (
              <p className="text-red-500 text-sm text-center mb-2">{verifyError}</p>
            )}

            <Button
              className="w-full mt-2"
              onClick={handleVerify}
              disabled={verifyLoading || !isOtpComplete}
            >
              {verifyLoading ? t("auth.verifying") : t("auth.verify")}
            </Button>

            {/* Resend */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {timerRunning ? (
                <span>
                  {t("auth.resendIn")} {secondsLeft}{t("auth.seconds")}
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-primary font-medium hover:underline"
                >
                  {t("auth.resend")}
                </button>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
