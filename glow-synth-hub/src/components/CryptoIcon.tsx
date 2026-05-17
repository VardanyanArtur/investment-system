import { motion } from 'framer-motion';
import { Bitcoin, Coins } from 'lucide-react';

interface CryptoIconProps {
  symbol: string;
  delay?: number;
}

export const CryptoIcon = ({ symbol, delay = 0 }: CryptoIconProps) => {
  const getIcon = () => {
    switch (symbol) {
      case 'BTC':
        return <Bitcoin className="h-full w-full" />;
      default:
        return <Coins className="h-full w-full" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay 
        }}
        className="text-primary w-16 h-16 md:w-20 md:h-20"
        style={{
          filter: 'drop-shadow(0 0 10px hsl(var(--primary)))'
        }}
      >
        {getIcon()}
      </motion.div>
    </motion.div>
  );
};
