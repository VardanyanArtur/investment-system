import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/api/api";


export default function Login() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
     const data = await userApi.login(form);

      if (!data.success || !data.token) {
        throw new Error(data.message || "Login failed");
      }

      await auth.login(data.token);
      toast({ description: t("auth.loginSuccess") });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast({ description: err.response.data.message || t("auth.loginError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
          {t("auth.welcomeBack") || "Welcome back"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("auth.email") || "Email"}
            </label>
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("auth.password") || "Password"}
            </label>
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
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (t("auth.loading") || "Loading...") : (t("auth.login") || "Log in")}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.dontHaveAccount") || "Don't have an account?"}{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            {t("auth.register") || "Register"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
