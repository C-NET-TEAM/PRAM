import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Shield, Zap, Crown } from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaLinkedin, FaYoutube, FaDiscord } from 'react-icons/fa';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';

const getPlatformIcon = (platform) => {
  switch (platform.toLowerCase()) {
    case 'facebook': return <FaFacebook className="w-3.5 h-3.5 text-[#1877F2]" />;
    case 'instagram': return <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" />;
    case 'whatsapp': return <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />;
    case 'threads': return <FaThreads className="w-3.5 h-3.5 text-foreground dark:text-white" />;
    case 'linkedin': return <FaLinkedin className="w-3.5 h-3.5 text-[#0A66C2]" />;
    case 'youtube': return <FaYoutube className="w-3.5 h-3.5 text-[#FF0000]" />;
    case 'discord': return <FaDiscord className="w-3.5 h-3.5 text-[#5865F2]" />;
    case 'x': return <FaXTwitter className="w-3.5 h-3.5 text-foreground dark:text-white" />;
    default: return <Check className="w-3.5 h-3.5 text-primary" />;
  }
};

export default function PlansPage() {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowQR(true);
  };

  const plans = [
    {
      id: 'basic',
      name: 'PRAM BASIC',
      price: '499',
      period: 'monthly',
      icon: <Shield className="w-5 h-5 text-primary" />,
      platforms: ['Facebook', 'Instagram', 'WhatsApp', 'Threads'],
      iconBg: 'bg-primary/10',
      checkColor: 'text-blue-500',
      checkBg: 'bg-blue-500/20',
      borderColor: 'border-blue-200 dark:border-blue-900',
      hoverColor: 'hover:border-blue-400'
    },
    {
      id: 'pro',
      name: 'PRAM PRO',
      price: '799',
      period: 'monthly',
      icon: <Zap className="w-5 h-5 text-primary" />,
      platforms: ['Facebook', 'Instagram', 'WhatsApp', 'Threads', 'LinkedIn', 'YouTube'],
      popular: true,
      iconBg: 'bg-primary/10',
      checkColor: 'text-purple-500',
      checkBg: 'bg-purple-500/20',
      borderColor: 'border-purple-200 dark:border-purple-900',
      hoverColor: 'hover:border-purple-400'
    },
    {
      id: 'enterprise',
      name: 'PRAM ENTERPISE',
      price: '999',
      period: 'monthly',
      icon: <Crown className="w-5 h-5 text-primary" />,
      platforms: ['Facebook', 'Instagram', 'WhatsApp', 'Threads', 'LinkedIn', 'YouTube', 'Discord', 'X'],
      iconBg: 'bg-primary/10',
      checkColor: 'text-amber-500',
      checkBg: 'bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-900',
      hoverColor: 'hover:border-amber-400'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-72px)] bg-background flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">Choose Your Plan</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-4">
            Scale your social media presence with the right tools. Select a plan below.
          </p>
        </div>

        {/* Responsive grid for pricing plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-8 w-full pb-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex-1 rounded-[1.5rem] border ${plan.borderColor} bg-card flex flex-col overflow-hidden`}
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-6 border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${plan.iconBg}`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-lg font-black text-foreground whitespace-nowrap tracking-wide">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground">₹{plan.price}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">/{plan.period === 'monthly' ? 'mo' : plan.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <p className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 underline decoration-primary decoration-2 underline-offset-[6px]">Supported Platforms</p>
                  <div className="flex flex-col gap-2.5">
                    {plan.platforms.map((platform, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full ${plan.checkBg} flex items-center justify-center flex-shrink-0`}>
                          {getPlatformIcon(platform)}
                        </div>
                        <span className="text-[13px] font-medium text-foreground/80">{platform}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePlanSelect(plan)}
                className="w-full py-4 text-sm font-bold transition-all bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center border-t border-primary/10"
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[2rem] p-6 relative shadow-2xl animate-in zoom-in-95 duration-300 border border-border/50">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-5">
              <div className={`w-14 h-14 ${selectedPlan?.iconBg} rounded-full flex items-center justify-center mx-auto mb-1 shadow-inner`}>
                {selectedPlan?.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Pay for {selectedPlan?.name}</h2>
                <p className="text-sm text-muted-foreground">Amount to pay: <span className="font-bold text-foreground text-base">₹{selectedPlan?.price}</span></p>
              </div>

              <div className="bg-white p-3 rounded-2xl inline-block mx-auto border border-primary/10 shadow-lg shadow-primary/5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=Payment_for_${selectedPlan?.name}_${selectedPlan?.price}`}
                  alt="Payment QR Code"
                  className="w-40 h-40 rounded-xl"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl text-[12px] font-medium flex items-center gap-2 text-left">
                <div className="p-1.5 bg-amber-500/20 rounded-full flex-shrink-0">
                  <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                Scan the mock QR code for demonstration purposes.
              </div>

              <button
                onClick={() => setShowQR(false)}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-[0.98]"
              >
                I've paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
