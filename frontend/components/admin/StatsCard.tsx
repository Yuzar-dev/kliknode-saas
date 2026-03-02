import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
    description?: string;
}

export default function StatsCard({ title, value, icon: Icon, trend, description }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600">{title}</h3>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={trend.isPositive ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                            />
                        </svg>
                        <span>{trend.value}%</span>
                    </div>
                )}
            </div>

            <div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                {description && (
                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                )}
                {trend?.label && (
                    <p className="text-xs text-slate-400 mt-2">{trend.label}</p>
                )}
            </div>
        </div>
    );
}
