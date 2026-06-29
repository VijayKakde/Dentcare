import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  variant?: 'primary' | 'accent' | 'success' | 'default';
}

const variantStyles = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  default: 'bg-secondary text-secondary-foreground',
};

export function FeatureCard({ icon: Icon, title, description, delay = 0, variant = 'default' }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="medical-card-hover p-6"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', variantStyles[variant])}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
