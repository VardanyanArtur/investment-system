import { Github, Twitter, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-primary/20 bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              {t('footer.terms')}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {t('footer.about')}
            </a>
          </div>

          <div className="flex gap-4">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-all hover:shadow-neon rounded-full p-2"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-all hover:shadow-neon rounded-full p-2"
            >
              <Github className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-all hover:shadow-neon rounded-full p-2"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};
