interface StatusBadgeProps {
    status: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
};

export default function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]}`}>
            {status}
        </span>
    );
}
