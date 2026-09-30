import React from 'react';
import { Platform } from '../types';
import {
  TelegramIcon,
  YouTubeIcon,
  RedditIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  XIcon,
} from './SocialBrandIcons';

interface PlatformBadgeProps {
  platform: Platform;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'sticker' | 'solid';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  showName = true,
  size = 'sm',
  variant = 'pill',
}) => {
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  const getInfo = () => {
    switch (platform) {
      case 'telegram':
        return {
          name: 'Telegram',
          color: 'bg-sky-50 text-sky-800 border-sky-300/80 shadow-xs hover:bg-sky-100',
          solidColor: 'bg-[#229ED9] text-white border-transparent shadow-sky-500/20',
          icon: <TelegramIcon className={iconClass} />,
        };
      case 'youtube':
        return {
          name: 'YouTube',
          color: 'bg-rose-50 text-rose-800 border-rose-300/80 shadow-xs hover:bg-rose-100',
          solidColor: 'bg-[#FF0000] text-white border-transparent shadow-red-500/20',
          icon: <YouTubeIcon className={iconClass} />,
        };
      case 'reddit':
        return {
          name: 'Reddit',
          color: 'bg-amber-50 text-amber-800 border-amber-300/80 shadow-xs hover:bg-amber-100',
          solidColor: 'bg-[#FF4500] text-white border-transparent shadow-orange-500/20',
          icon: <RedditIcon className={iconClass} />,
        };
      case 'facebook':
        return {
          name: 'Facebook',
          color: 'bg-blue-50 text-blue-800 border-blue-300/80 shadow-xs hover:bg-blue-100',
          solidColor: 'bg-[#1877F2] text-white border-transparent shadow-blue-500/20',
          icon: <FacebookIcon className={iconClass} />,
        };
      case 'instagram':
        return {
          name: 'Instagram',
          color: 'bg-pink-50 text-pink-800 border-pink-300/80 shadow-xs hover:bg-pink-100',
          solidColor: 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white border-transparent shadow-pink-500/20',
          icon: <InstagramIcon className={iconClass} />,
        };
      case 'x':
      case 'twitter':
        return {
          name: 'Twitter / X',
          color: 'bg-slate-100 text-slate-800 border-slate-300 shadow-xs hover:bg-slate-200',
          solidColor: 'bg-slate-900 text-white border-transparent shadow-slate-900/20',
          icon: <TwitterIcon className={iconClass} />,
        };
      default:
        return {
          name: 'Social',
          color: 'bg-slate-100 text-slate-700 border-slate-300 shadow-xs',
          solidColor: 'bg-slate-600 text-white border-transparent',
          icon: <TwitterIcon className={iconClass} />,
        };
    }
  };

  const info = getInfo();

  if (variant === 'sticker') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-xl border shadow-sm transition-all duration-150 select-none ${
          info.color
        } ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[11px]'
            : size === 'md'
            ? 'px-3 py-1 text-xs'
            : 'px-4 py-1.5 text-sm'
        }`}
      >
        {info.icon}
        {showName && <span className="tracking-tight">{info.name}</span>}
      </span>
    );
  }

  if (variant === 'solid') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-xl shadow-md transition-all duration-150 select-none ${
          info.solidColor
        } ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[11px]'
            : size === 'md'
            ? 'px-3 py-1 text-xs'
            : 'px-4 py-1.5 text-sm'
        }`}
      >
        {info.icon}
        {showName && <span className="tracking-tight">{info.name}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border transition-colors ${
        info.color
      } ${
        size === 'sm'
          ? 'px-2 py-0.5 text-xs'
          : size === 'md'
          ? 'px-2.5 py-1 text-xs'
          : 'px-3.5 py-1.5 text-sm'
      }`}
    >
      {info.icon}
      {showName && <span>{info.name}</span>}
    </span>
  );
};
