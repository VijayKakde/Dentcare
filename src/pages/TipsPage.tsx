import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Droplets, UtensilsCrossed, Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { key: 'hygiene', icon: Sparkles },
  { key: 'brushing', icon: Droplets },
  { key: 'diet', icon: UtensilsCrossed },
  { key: 'prevention', icon: Shield },
];

export default function TipsPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('hygiene');

  const getTips = (category: string): string[] => {
    const tips = t(`tips.${category}.tips`, { returnObjects: true }) as unknown;
    if (Array.isArray(tips)) {
      return tips.filter((tip): tip is string => typeof tip === 'string');
    }
    return [];
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('tips.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('tips.subtitle')}
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-primary'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`tips.categories.${cat.key}`)}
              </button>
            );
          })}
        </motion.div>

        {/* Tips content */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="medical-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {categories.find(c => c.key === activeCategory) && (
                  (() => {
                    const Icon = categories.find(c => c.key === activeCategory)!.icon;
                    return <Icon className="h-6 w-6 text-primary" />;
                  })()
                )}
              </div>
              <h2 className="font-display text-xl font-bold">
                {t(`tips.${activeCategory}.title`)}
              </h2>
            </div>

            <ul className="space-y-4">
              {getTips(activeCategory).map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success/10"
                >
                  <div className="shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-foreground leading-relaxed">{tip}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Quick info cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto"
        >
          {[
            { emoji: '🪥', value: '2x', label: 'Brush daily' },
            { emoji: '⏱️', value: '2 min', label: 'Each session' },
            { emoji: '🦷', value: '6 mo', label: 'Dental visits' },
            { emoji: '💧', value: '8+', label: 'Glasses of water' },
          ].map((stat, index) => (
            <div
              key={index}
              className="medical-card p-5 text-center"
            >
              <span className="text-3xl mb-2 block">{stat.emoji}</span>
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
