import React from 'react';

// Exact SVG Brand Icons with official brand colors and paths
export const InstagramIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient
        id="instaGrad"
        cx="30%"
        cy="105%"
        r="115%"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="10%" stopColor="#fdf497" />
        <stop offset="50%" stopColor="#fd5949" />
        <stop offset="65%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6.5" fill="url(#instaGrad)" />
    <rect
      x="4.7"
      y="4.7"
      width="14.6"
      height="14.6"
      rx="4.2"
      stroke="#ffffff"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="12" r="3.6" stroke="#ffffff" strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="1.1" fill="#ffffff" />
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M14.5 12.2h-1.9v6.8h-2.8v-6.8H8.5V9.8h1.3V8.2c0-1.8 1.1-2.9 2.8-2.9.8 0 1.7.1 1.9.1v2.1h-1.1c-.9 0-1.1.4-1.1 1.1v1.3h2.3l-.3 2.4z"
      fill="#ffffff"
    />
  </svg>
);

export const TwitterIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
    <path
      d="M18 7.8c-.5.2-1.1.4-1.7.5.6-.4 1.1-.9 1.3-1.6-.6.3-1.2.6-1.9.7-.5-.6-1.3-.9-2.1-.9-1.6 0-2.9 1.3-2.9 2.9 0 .2 0 .5.1.7-2.4-.1-4.6-1.3-6-3.1-.3.4-.4.9-.4 1.5 0 1 .5 1.9 1.3 2.4-.5 0-.9-.1-1.3-.4v.1c0 1.4 1 2.6 2.4 2.9-.2.1-.5.1-.8.1-.2 0-.4 0-.5-.1.4 1.2 1.5 2 2.8 2-1 1-2.4 1.4-3.8 1.4-.3 0-.5 0-.7 0 1.4.9 3 1.4 4.8 1.4 5.7 0 8.9-4.8 8.9-8.9v-.4c.6-.5 1.1-1.1 1.5-1.7z"
      fill="#ffffff"
    />
  </svg>
);

export const XIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="6" fill="#0f1419" />
    <path
      d="M17.3 5.5h2.2l-4.8 5.5 5.7 7.5h-4.5l-3.5-4.6-4 4.6H6.2l5.1-5.9L5.8 5.5h4.6l3.2 4.2 3.7-4.2zm-.8 11.7h1.2L9.2 6.7H7.9l8.6 10.5z"
      fill="#ffffff"
    />
  </svg>
);

export const TelegramIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="tgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#2AABEE" />
        <stop offset="100%" stopColor="#229ED9" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#tgGrad)" />
    <path
      d="M5.4 11.6l10.9-4.2c.5-.2 1 .1.8.8l-1.9 8.8c-.1.6-.5.8-1 .5l-2.8-2.1-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5.1-4.6c.2-.2 0-.3-.3-.1l-6.3 4-2.7-.8c-.6-.2-.6-.6.1-.9z"
      fill="#ffffff"
    />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8z"
      fill="#FF0000"
    />
    <polygon points="10,15 15.5,12 10,9" fill="#ffffff" />
  </svg>
);

export const RedditIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#FF4500" />
    <path
      d="M19 12c0-.8-.7-1.5-1.5-1.5-.4 0-.8.2-1 .5-1.1-.8-2.6-1.3-4.2-1.3l.7-3.4 2.3.5c0 .6.6 1.1 1.2 1.1.7 0 1.2-.6 1.2-1.2s-.6-1.2-1.2-1.2c-.5 0-.9.3-1.1.7l-2.6-.6c-.2 0-.3.1-.4.3l-.9 4c-1.7 0-3.2.5-4.3 1.3-.3-.3-.7-.5-1.1-.5-.8 0-1.5.7-1.5 1.5 0 .6.3 1.1.8 1.3 0 .2 0 .5 0 .7 0 2.4 2.8 4.3 6.3 4.3s6.3-1.9 6.3-4.3c0-.2 0-.5 0-.7.5-.2.8-.7.8-1.3zm-9.5.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm5 4.5c-.7.7-2 .7-2.5.7s-1.8 0-2.5-.7c-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .5.5 1.5.6 2.1.6.6 0 1.6-.1 2.1-.6.1-.1.3-.1.4 0 .1.1.1.3 0 .4zm-.3-3.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"
      fill="#ffffff"
    />
  </svg>
);

export const WhatsAppIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#25D366" />
    <path
      d="M17.5 14.5c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.3-.4.1-.1.1-.2.2-.3.1-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.4c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.2-.2-.4-.3-.6-.4z"
      fill="#ffffff"
    />
  </svg>
);

// SOCIAL MEDIA STICKER COMPONENT
// Playful, vibrant sticker badges with drop-shadows and rotation angles
export const SocialSticker: React.FC<{
  type: 'instagram' | 'facebook' | 'twitter' | 'telegram' | 'youtube' | 'reddit' | 'whatsapp' | 'viral' | 'comment';
  label: string;
  subtext?: string;
  rotate?: string;
  onClick?: () => void;
}> = ({ type, label, subtext, rotate = 'rotate-0', onClick }) => {
  const getStyles = () => {
    switch (type) {
      case 'instagram':
        return {
          icon: <InstagramIcon className="w-5 h-5 shadow-xs shrink-0" />,
          bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-pink-500/20',
          border: 'border-white/30',
          badgeText: 'Insta Live',
        };
      case 'facebook':
        return {
          icon: <FacebookIcon className="w-5 h-5 shrink-0" />,
          bg: 'bg-[#1877F2] text-white shadow-blue-500/20',
          border: 'border-white/30',
          badgeText: 'FB Pulse',
        };
      case 'twitter':
        return {
          icon: <TwitterIcon className="w-5 h-5 shrink-0" />,
          bg: 'bg-[#1DA1F2] text-white shadow-sky-500/20',
          border: 'border-white/30',
          badgeText: 'Twitter / X',
        };
      case 'telegram':
        return {
          icon: <TelegramIcon className="w-5 h-5 shrink-0" />,
          bg: 'bg-gradient-to-r from-[#2AABEE] to-[#229ED9] text-white shadow-cyan-500/20',
          border: 'border-white/30',
          badgeText: 'Telegram Hub',
        };
      case 'youtube':
        return {
          icon: <YouTubeIcon className="w-5 h-5 shrink-0" />,
          bg: 'bg-[#FF0000] text-white shadow-red-500/20',
          border: 'border-white/30',
          badgeText: 'YT Shorts & Live',
        };
      case 'reddit':
        return {
          icon: <RedditIcon className="w-5 h-5 shrink-0" />,
          bg: 'bg-[#FF4500] text-white shadow-orange-500/20',
          border: 'border-white/30',
          badgeText: 'Reddit India',
        };
      case 'whatsapp':
        return {
          icon: <WhatsAppIcon className="w-5 h-5 shrink-0" />,
          bg: 'bg-[#25D366] text-white shadow-emerald-500/20',
          border: 'border-white/30',
          badgeText: 'Forward Wave',
        };
      case 'viral':
        return {
          icon: <span className="text-base">🔥</span>,
          bg: 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30',
          border: 'border-white/40',
          badgeText: 'Viral Anomaly',
        };
      case 'comment':
        return {
          icon: <span className="text-base">💬</span>,
          bg: 'bg-violet-600 text-white shadow-violet-500/20',
          border: 'border-white/30',
          badgeText: 'Hinglish Feed',
        };
    }
  };

  const style = getStyles();

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-md border-2 ${style.border} ${style.bg} ${rotate} hover:scale-105 hover:rotate-0 transition-all duration-200 cursor-pointer select-none font-sans`}
    >
      {style.icon}
      <div className="flex flex-col text-left leading-none">
        <span className="text-[11px] font-extrabold tracking-tight">{label}</span>
        {subtext && (
          <span className="text-[9px] opacity-90 font-mono mt-0.5 font-bold">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

// SOCIAL MEDIA LIVE TICKER / STICKER MARQUEE
// Gives an unmistakable, vibrant social media command center feel
export const SocialTickerRibbon: React.FC<{ onPlatformClick?: (p: string) => void }> = ({
  onPlatformClick,
}) => {
  const stickers = [
    {
      platform: 'telegram',
      icon: <TelegramIcon className="w-4 h-4" />,
      tag: 'Telegram Live',
      metric: '1,240+ Channels',
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20',
      dot: 'bg-sky-400',
    },
    {
      platform: 'instagram',
      icon: <InstagramIcon className="w-4 h-4" />,
      tag: 'Instagram Reels',
      metric: '84k Mentions/hr',
      color: 'bg-pink-500/10 text-pink-300 border-pink-500/30 hover:bg-pink-500/20',
      dot: 'bg-pink-400',
    },
    {
      platform: 'twitter',
      icon: <TwitterIcon className="w-4 h-4" />,
      tag: 'Twitter / X Trends',
      metric: '#NEET_POSTPONE',
      color: 'bg-sky-500/10 text-sky-300 border-sky-400/30 hover:bg-sky-500/20',
      dot: 'bg-sky-300',
    },
    {
      platform: 'youtube',
      icon: <YouTubeIcon className="w-4 h-4" />,
      tag: 'YouTube Comments',
      metric: '12 Live Streams',
      color: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
      dot: 'bg-red-400',
    },
    {
      platform: 'facebook',
      icon: <FacebookIcon className="w-4 h-4" />,
      tag: 'Facebook Groups',
      metric: '420k Student Reach',
      color: 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20',
      dot: 'bg-blue-400',
    },
    {
      platform: 'reddit',
      icon: <RedditIcon className="w-4 h-4" />,
      tag: 'Reddit India',
      metric: 'r/JEENEETards Hot',
      color: 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20',
      dot: 'bg-orange-400',
    },
    {
      platform: 'whatsapp',
      icon: <WhatsAppIcon className="w-4 h-4" />,
      tag: 'WhatsApp Tip-offs',
      metric: 'Forward Cascade',
      color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
      dot: 'bg-emerald-400',
    },
  ];

  return (
    <div className="w-full bg-slate-950 border-b border-slate-800 text-white py-2 px-3 sm:px-6 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Social Telemetry:</span>
        </div>

        {stickers.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onPlatformClick && onPlatformClick(s.platform)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-150 ${s.color} shrink-0 cursor-pointer`}
          >
            {s.icon}
            <span className="font-bold">{s.tag}</span>
            <span className="text-[10px] opacity-75 font-mono">({s.metric})</span>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse ml-0.5`} />
          </button>
        ))}
      </div>
    </div>
  );
};
