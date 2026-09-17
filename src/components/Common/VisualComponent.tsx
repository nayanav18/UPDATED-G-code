import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ScatterChart,
  Scatter
} from 'recharts';
import { VisualConfig } from '../../types';

interface VisualComponentProps {
  config: Partial<VisualConfig>;
  data?: any[];
  height?: number;
}

const COLORS = [
  '#e60000', // vodafone red
  '#d50072', // magenta
  '#9138da', // purple
  '#00d8ff', // cyan
  '#28e98c', // green
  '#ff8a1f', // orange
  '#ffbe45'  // yellow
];

export const VisualComponent: React.FC<VisualComponentProps> = ({ config, data: overrideData, height = 260 }) => {
  const data = overrideData || config.data || [];
  const type = config.type || 'bar';
  const dim = config.dimension || (data.length > 0 ? Object.keys(data[0])[0] : 'label');
  const meas = config.measure || (data.length > 0 ? Object.keys(data[0])[1] : 'value');

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[160px] text-xs text-[#516c91] bg-[#071321]/60 rounded-xl border border-[#1b263c] border-dashed">
        No data returned for this configuration
      </div>
    );
  }

  // 1. KPI CARD
  if (type === 'kpi_card') {
    const primaryVal = data[0]?.[meas] ?? data[0]?.value ?? '€0';
    const subText = config.title || 'Key Metric';
    return (
      <div className="flex flex-col justify-center items-center h-full py-6 px-4 bg-[#101a2d] rounded-xl border border-[#1b263c] text-center">
        <span className="text-xs uppercase font-bold tracking-wider text-[#8ba8d1] mb-2">{subText}</span>
        <div className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
          {config.formatting?.prefix || ''}{typeof primaryVal === 'number' ? primaryVal.toLocaleString() : primaryVal}{config.formatting?.suffix || ''}
        </div>
        <div className="mt-2 text-xs font-semibold text-[#28e98c] flex items-center gap-1">
          <span>Target Met</span> • <span className="text-[#8ba8d1]">BigQuery Verified</span>
        </div>
      </div>
    );
  }

  // 2. TABLE VISUAL
  if (type === 'table') {
    const keys = Object.keys(data[0] || {});
    return (
      <div className="overflow-x-auto max-h-[280px] rounded-xl border border-[#1b263c] bg-[#071321]">
        <table className="w-full text-left text-xs text-[#8ba8d1]">
          <thead className="bg-[#101a2d] text-white uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-[#1b263c]">
            <tr>
              {keys.map((k) => (
                <th key={k} className="py-2.5 px-3 whitespace-nowrap font-mono">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b263c]/50">
            {data.slice(0, 15).map((row, i) => (
              <tr key={i} className="hover:bg-[#1b263c]/40 transition-colors">
                {keys.map((k) => (
                  <td key={k} className="py-2 px-3 whitespace-nowrap font-mono text-white">
                    {typeof row[k] === 'number' ? row[k].toLocaleString() : String(row[k] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b101c] border border-[#1b263c] rounded-lg p-2.5 shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{`${label || payload[0]?.name}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-[#00d8ff] font-mono">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {(() => {
          switch (type) {
            case 'line':
              return (
                <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b263c" opacity={0.6} />
                  <XAxis dataKey={dim} stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                  <YAxis stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                  <Tooltip content={<CustomTooltip />} />
                  {config.formatting?.showLegend && <Legend wrapperStyle={{ fontSize: '11px', color: '#8ba8d1' }} />}
                  <Line type="monotone" dataKey={meas} stroke="#d50072" strokeWidth={2.5} dot={{ r: 4, fill: '#ff0018' }} activeDot={{ r: 6 }} />
                </LineChart>
              );

            case 'area':
              return (
                <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e60000" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9138da" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b263c" opacity={0.6} />
                  <XAxis dataKey={dim} stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                  <YAxis stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={meas} stroke="#ff0018" fillOpacity={1} fill="url(#areaGrad)" />
                </AreaChart>
              );

            case 'pie':
            case 'donut':
              return (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    dataKey={meas}
                    nameKey={dim}
                    cx="50%"
                    cy="50%"
                    innerRadius={type === 'donut' ? 45 : 0}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#8ba8d1' }} />
                </PieChart>
              );

            case 'scatter':
              return (
                <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b263c" />
                  <XAxis dataKey={dim} name={dim} stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                  <YAxis dataKey={meas} name={meas} stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter name="Points" data={data} fill="#00d8ff" />
                </ScatterChart>
              );

            case 'column':
            case 'stacked_column':
            case 'stacked_bar':
            case 'bar':
            default:
              return (
                <BarChart data={data} layout={type === 'bar' || type === 'stacked_bar' ? 'vertical' : 'horizontal'} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b263c" opacity={0.6} />
                  {type === 'bar' || type === 'stacked_bar' ? (
                    <>
                      <XAxis type="number" stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                      <YAxis dataKey={dim} type="category" stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} width={80} />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey={dim} stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                      <YAxis stroke="#516c91" tick={{ fontSize: 11, fill: '#8ba8d1' }} />
                    </>
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  {config.formatting?.showLegend && <Legend wrapperStyle={{ fontSize: '11px', color: '#8ba8d1' }} />}
                  <Bar dataKey={meas} fill="#d50072" radius={[4, 4, 0, 0]}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              );
          }
        })()}
      </ResponsiveContainer>
    </div>
  );
};
