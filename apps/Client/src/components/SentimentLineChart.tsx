import React, { useState } from 'react';
import { SentimentTimelinePoint, Language, Mode } from '../types';
import { translations } from '../translations';

interface SentimentLineChartProps {
  data: SentimentTimelinePoint[];
  language: Language;
  mode: Mode;
}

export const SentimentLineChart: React.FC<SentimentLineChartProps> = ({ data, language, mode }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter or scale data based on timeRange
  const getDisplayData = () => {
    switch (timeRange) {
      case '1h':
        return data.slice(-3);
      case '6h':
        return data.slice(-6);
      case '24h':
      default:
        return data;
      case '7d':
        // Generate simulated daily aggregates from 24h
        return [
          { time: 'Day 1', positive: 32, neutral: 45, negative: 23, dominantEmotion: 'Calm' },
          { time: 'Day 2', positive: 30, neutral: 44, negative: 26, dominantEmotion: 'Calm' },
          { time: 'Day 3', positive: 28, neutral: 41, negative: 31, dominantEmotion: 'Curiosity' },
          { time: 'Day 4', positive: 27, neutral: 39, negative: 34, dominantEmotion: 'Curiosity' },
          { time: 'Day 5', positive: 25, neutral: 37, negative: 38, dominantEmotion: 'Anxiety' },
          { time: 'Day 6', positive: 22, neutral: 35, negative: 43, dominantEmotion: 'Anxiety' },
          { time: 'Day 7 (Today)', positive: 18, neutral: 29, negative: 53, dominantEmotion: 'Anxiety (Spike)' },
        ];
    }
  };

  const points = getDisplayData();

  // If in Lite Mode, render high-efficiency tabular view instead of heavy SVG canvas
  if (mode === 'lite') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Lite Mode Table View</span>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded text-xs">
            {(['1h', '6h', '24h', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded font-medium ${
                  timeRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2 text-rose-600">Negative</th>
                <th className="p-2 text-slate-600">Neutral</th>
                <th className="p-2 text-emerald-600">Positive</th>
                <th className="p-2">Dominant Emotion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {points.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 font-mono font-bold">{p.time}</td>
                  <td className="p-2 font-bold text-rose-700">{p.negative}%</td>
                  <td className="p-2">{p.neutral}%</td>
                  <td className="p-2 text-emerald-700 font-semibold">{p.positive}%</td>
                  <td className="p-2 text-slate-800">{p.dominantEmotion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Full interactive SVG Line Chart
  const svgWidth = 650;
  const svgHeight = 220;
  const padX = 45;
  const padY = 25;
  const graphWidth = svgWidth - padX * 2;
  const graphHeight = svgHeight - padY * 2;

  // Coordinate mapper
  const getX = (index: number) => padX + (index / (points.length - 1 || 1)) * graphWidth;
  const getY = (value: number) => padY + graphHeight - (value / 70) * graphHeight; // 0 to 70% scale

  // Build SVG path
  const makePath = (key: 'positive' | 'neutral' | 'negative') => {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
      .join(' ');
  };

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="space-y-3">
      {/* Time range switcher & legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-0.5 bg-rose-500 rounded-full" />
            {language === 'hi' ? 'नकारात्मक' : 'Negative'}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
            {language === 'hi' ? 'तटस्थ' : 'Neutral'}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full" />
            {language === 'hi' ? 'सकारात्मक' : 'Positive'}
          </span>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range);
                setHoverIndex(null);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {range === '1h'
                ? language === 'hi' ? '1 घंटा' : '1 hour'
                : range === '6h'
                ? language === 'hi' ? '6 घंटे' : '6 hours'
                : range === '24h'
                ? language === 'hi' ? '24 घंटे' : '24 hours'
                : language === 'hi' ? '7 दिन' : '7 days'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 select-none"
        >
          {/* Horizontal grid lines */}
          {[10, 25, 40, 55, 70].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padX}
                  y1={y}
                  x2={svgWidth - padX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[9px] font-mono"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <path
            d={makePath('negative')}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={makePath('neutral')}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={makePath('positive')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive vertical hover indicator and dots */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const isHovered = hoverIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                className="cursor-pointer"
              >
                {/* Invisible hit column */}
                <rect
                  x={x - 15}
                  y={padY}
                  width={30}
                  height={graphHeight}
                  fill="transparent"
                />

                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padY}
                    x2={x}
                    y2={padY + graphHeight}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Circles */}
                <circle
                  cx={x}
                  cy={getY(p.negative)}
                  r={isHovered ? 5 : 3}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={getY(p.positive)}
                  r={isHovered ? 5 : 3}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* X-axis labels */}
                <text
                  x={x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className={`text-[9px] font-mono ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400'
                  }`}
                >
                  {p.time}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip / Active Point Pill */}
        {hoveredPoint && (
          <div className="flex flex-wrap items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800">
                {hoveredPoint.time}:
              </span>
              <span className="text-rose-600 font-bold">
                Neg {hoveredPoint.negative}%
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">
                Neu {hoveredPoint.neutral}%
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 font-bold">
                Pos {hoveredPoint.positive}%
              </span>
            </div>
            <div className="text-slate-500 font-medium text-[11px]">
              {language === 'hi' ? 'प्रमुख मनोदशा:' : 'Emotion state:'}{' '}
              <strong className="text-rose-600">{hoveredPoint.dominantEmotion}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
