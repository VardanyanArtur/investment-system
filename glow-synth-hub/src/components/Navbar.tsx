import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  MessageCircle,
  Home,
  User,
  Star,
  Flag,
  Users,
  Moon,
  Sun,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminLogo from "./images/admin.webp";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import * as React from "react";

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  // Shared classes for mobile items to prevent overlap
  const mobileItem =
    "flex flex-col items-center justify-center gap-1 py-2 w-full whitespace-nowrap overflow-hidden text-ellipsis text-[10px] xs:text-[11px] sm:text-xs leading-none text-foreground hover:text-primary transition-colors min-w-[56px]";

  return (
    <>
      {/* Desktop Navbar - Top */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Zap className="h-8 w-8 text-primary animate-glow-pulse" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AstroBit
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
              >
                <Home className="h-5 w-5" /> {t("navbar.home")}
              </Link>

              <Link
                to="/vips"
                className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
              >
                <Star className="h-5 w-5" /> {t("navbar.vips")}
              </Link>

              <Link
                to="/missions"
                className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
              >
                <Flag className="h-5 w-5" /> {t("navbar.missions")}
              </Link>

              <Link
                to="/team"
                className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
              >
                <Users className="h-5 w-5" /> {t("navbar.team")}
              </Link>

              {/* Support Dialog (Desktop) */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-foreground" />
                    <span className="text-sm font-medium">
                      {t("navbar.support")}
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm text-center p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold mb-4">
                      {t("navbar.supportTitle")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <MessageCircle className="text-primary w-6 h-6" />
                      <p className="font-medium">{t("navbar.telegramChannel")}</p>
                      <a
                        href="https://t.me/your_channel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 break-all"
                      >
                        @AstroBitChannel
                      </a>
                    </div>
                    <div className="w-full h-px bg-border" />
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={AdminLogo}
                        alt="Admin Bot"
                        className="w-12 h-12 rounded-full"
                      />
                      <p className="font-medium">{t("navbar.adminBot")}</p>
                      <a
                        href="https://t.me/your_admin_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary underline hover:text-secondary/80 break-all"
                      >
                        @AstroBitSupportBot
                      </a>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* User / Login */}
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                >
                  <User className="h-5 w-5" />
                  {t("navbar.me")}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                >
                  <User className="h-5 w-5" />
                  {t("navbar.signIn")}
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>

              {/* Language Selector */}
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none hover:border-primary transition-colors cursor-pointer z-50 min-w-[84px]"
                style={{ colorScheme: theme === "light" ? "light" : "dark" }}
              >
                <option value="en">🇺🇸 EN</option>
                <option value="ru">🇷🇺 RU</option>
                <option value="zh">🇨🇳 CN</option>
                <option value="hy">🇦🇲 AM</option>
                <option value="az">🇦🇿 AZ</option>
                <option value="tr">🇹🇷 TR</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="es">🇪🇸 ES</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Bottom (5 items, no overlap) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] border-t border-primary/20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-stretch justify-between px-2 py-2">
          <Link to="/" className={mobileItem} aria-label={t("navbar.home") as string}>
            <Home className="h-5 w-5" />
            <span className="truncate">{t("navbar.home")}</span>
          </Link>

          <Link
            to="/dashboard"
            className={mobileItem}
            aria-label={t("navbar.me") as string}
          >
            <User className="h-5 w-5" />
            <span className="truncate">{t("navbar.me")}</span>
          </Link>

          <Link
            to="/vips"
            className={mobileItem}
            aria-label={t("navbar.vips") as string}
          >
            <Star className="h-5 w-5" />
            <span className="truncate">{t("navbar.vips")}</span>
          </Link>

          <Link
            to="/missions"
            className={mobileItem}
            aria-label={t("navbar.missions") as string}
          >
            <Flag className="h-5 w-5" />
            <span className="truncate">{t("navbar.missions")}</span>
          </Link>

          <Link
            to="/team"
            className={mobileItem}
            aria-label={t("navbar.team") as string}
          >
            <Users className="h-5 w-5" />
            <span className="truncate">{t("navbar.team")}</span>
          </Link>
        </div>

        {/* iOS safe-area spacer */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Floating Support Button (mobile only) */}
      <div className="md:hidden fixed z-[70] right-3 bottom-20">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="
                inline-flex items-center gap-2
                rounded-full px-3.5 py-2
                bg-primary text-primary-foreground
                shadow-lg shadow-primary/30
                hover:opacity-90 active:scale-95
                transition-transform
                border border-primary/30
              "
              aria-label={t("navbar.support") as string}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Support</span>
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-sm text-center p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold mb-4">
                {t("navbar.supportTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <MessageCircle className="text-primary w-6 h-6" />
                <p className="font-medium">{t("navbar.telegramChannel")}</p>
                <a
                  href="https://t.me/your_channel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80 break-all"
                >
                  @AstroBitChannel
                </a>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex flex-col items-center gap-2">
                <img
                  src={AdminLogo}
                  alt="Admin Bot"
                  className="w-12 h-12 rounded-full"
                />
                <p className="font-medium">{t("navbar.adminBot")}</p>
                <a
                  href="https://t.me/your_admin_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary underline hover:text-secondary/80 break-all"
                >
                  @AstroBitSupportBot
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Top spacer for desktop navbar height — ZERO on mobile */}
      <div className="h-0 md:h-16" />

      {/* Bottom spacer for mobile navbar height */}
      <div className="md:hidden h-[64px]" />
    </>
  );
};
