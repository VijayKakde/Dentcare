import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, Bot, User, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

const botResponses: Record<string, string> = {
  'dental caries': 'Dental caries, commonly known as tooth decay or cavities, is a disease that damages the hard surface of your teeth. It\'s caused by bacteria that produce acid when they break down sugar in your mouth. If left untreated, caries can lead to pain, infection, and tooth loss.',
  'prevent cavities': 'To prevent cavities: 1) Brush twice daily with fluoride toothpaste, 2) Floss daily, 3) Limit sugary foods and drinks, 4) Visit your dentist regularly, 5) Consider dental sealants, and 6) Drink plenty of water.',
  'brushing': 'Proper brushing technique: Hold your brush at a 45-degree angle to your gums. Use short, gentle strokes. Brush all surfaces - outer, inner, and chewing surfaces. Brush for at least 2 minutes, twice a day. Don\'t forget to brush your tongue!',
  'dentist': 'You should visit your dentist: 1) Every 6 months for regular check-ups, 2) If you experience tooth pain, 3) If your gums bleed when brushing, 4) If you notice white spots or discoloration on teeth, 5) If you have persistent bad breath.',
  'default': 'I can help you with questions about dental caries, oral hygiene, brushing techniques, and when to visit a dentist. What would you like to know?',
};

function getBotResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('caries') || lowerMsg.includes('cavity') || lowerMsg.includes('decay') || lowerMsg.includes('किड')) {
    return botResponses['dental caries'];
  }
  if (lowerMsg.includes('prevent') || lowerMsg.includes('avoid') || lowerMsg.includes('रोख')) {
    return botResponses['prevent cavities'];
  }
  if (lowerMsg.includes('brush') || lowerMsg.includes('ब्रश')) {
    return botResponses['brushing'];
  }
  if (lowerMsg.includes('dentist') || lowerMsg.includes('visit') || lowerMsg.includes('doctor') || lowerMsg.includes('दंतवैद्य')) {
    return botResponses['dentist'];
  }
  
  return botResponses['default'];
}

export default function ChatbotPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add greeting message
    setMessages([
      {
        id: 'greeting',
        role: 'bot',
        content: t('chatbot.greeting'),
        timestamp: new Date(),
      },
    ]);
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: getBotResponse(input),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const suggestions = [
    { key: 'whatIsCaries', label: t('chatbot.suggestions.whatIsCaries') },
    { key: 'prevention', label: t('chatbot.suggestions.prevention') },
    { key: 'brushingTips', label: t('chatbot.suggestions.brushingTips') },
    { key: 'whenToVisit', label: t('chatbot.suggestions.whenToVisit') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border py-4">
        <div className="container px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{t('chatbot.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('chatbot.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-6">
        <div className="container px-4 max-w-3xl">
          {/* Suggestions */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Quick questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleSuggestion(s.label)}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages list */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'bot' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {message.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="chat-bubble-bot">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-warning/5 border-t border-warning/20 py-2">
        <div className="container px-4 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
            <p>{t('chatbot.disclaimer')}</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border py-4">
        <div className="container px-4 max-w-3xl">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chatbot.placeholder')}
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="btn-primary-gradient shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
