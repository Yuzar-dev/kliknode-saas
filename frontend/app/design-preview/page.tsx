'use client';

import { useState } from 'react';

/* ─── KlikNode Design Preview V2 ─── Revolut-inspired LIGHT + Glassmorphism ─── */

const PALETTE = {
    // Backgrounds
    bg: '#F0F2F5',
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceSolid: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.55)',
    glassBorder: 'rgba(255, 255, 255, 0.6)',
    glassStrong: 'rgba(255, 255, 255, 0.8)',

    // Text
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',

    // Borders
    border: 'rgba(148, 163, 184, 0.2)',
    borderLight: 'rgba(148, 163, 184, 0.12)',

    // Brand
    primary: '#0666EB',
    primaryHover: '#0553C7',
    primaryLight: 'rgba(6, 102, 235, 0.08)',
    primaryGlow: 'rgba(6, 102, 235, 0.15)',

    // Accent — futuristic
    accent: '#7C3AED',
    accentLight: 'rgba(124, 58, 237, 0.08)',
    cyan: '#06B6D4',
    cyanLight: 'rgba(6, 182, 212, 0.08)',
    indigo: '#6366F1',
    indigoLight: 'rgba(99, 102, 241, 0.08)',

    // Semantic
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.08)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.08)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.08)',
};

const GLASS = {
    card: {
        background: PALETTE.glass,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${PALETTE.glassBorder}`,
        borderRadius: 20,
    } as React.CSSProperties,
    strong: {
        background: PALETTE.glassStrong,
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        border: `1px solid ${PALETTE.glassBorder}`,
        borderRadius: 20,
    } as React.CSSProperties,
    subtle: {
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid rgba(255,255,255,0.5)`,
        borderRadius: 16,
    } as React.CSSProperties,
};

export default function DesignPreviewPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'components'>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            background: `linear-gradient(135deg, #E8EDFB 0%, ${PALETTE.bg} 40%, #EDE9FB 100%)`,
            minHeight: '100vh', color: PALETTE.text,
        }}>
            <div style={{ display: 'flex', minHeight: '100vh' }}>

                {/* ══════════ SIDEBAR ══════════ */}
                <aside style={{
                    width: sidebarCollapsed ? 72 : 260,
                    ...GLASS.strong,
                    borderRadius: 0,
                    borderRight: `1px solid ${PALETTE.border}`,
                    display: 'flex', flexDirection: 'column',
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
                    overflow: 'hidden',
                }}>
                    {/* Logo */}
                    <div style={{
                        padding: sidebarCollapsed ? '20px 16px' : '20px 24px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderBottom: `1px solid ${PALETTE.border}`,
                        minHeight: 72,
                    }}>
                        <img src="/logo-dark.svg" alt="KlikNode" style={{ height: 34, width: 34, objectFit: 'contain' }} />
                        {!sidebarCollapsed && (
                            <span style={{
                                fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px',
                                background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.accent})`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                kliknode
                            </span>
                        )}
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: PALETTE.textMuted, padding: sidebarCollapsed ? '8px 4px' : '8px 12px', marginBottom: 4, display: sidebarCollapsed ? 'none' : 'block' }}>
                            General
                        </p>
                        {[
                            { icon: 'dashboard', label: 'Dashboard', tab: 'dashboard' as const },
                            { icon: 'credit_card', label: 'Ma Carte', tab: 'profile' as const },
                            { icon: 'link', label: 'Mes Liens', tab: null },
                            { icon: 'bar_chart', label: 'Analytics', tab: null },
                        ].map((item) => {
                            const active = item.tab === activeTab;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => item.tab && setActiveTab(item.tab)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: sidebarCollapsed ? '10px 14px' : '10px 14px',
                                        borderRadius: 12, border: 'none', cursor: 'pointer',
                                        fontSize: 14, fontWeight: active ? 600 : 500,
                                        background: active ? `linear-gradient(135deg, ${PALETTE.primaryLight}, ${PALETTE.accentLight})` : 'transparent',
                                        color: active ? PALETTE.primary : PALETTE.textSecondary,
                                        transition: 'all 0.2s ease',
                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                        width: '100%', textAlign: 'left', fontFamily: 'inherit',
                                        boxShadow: active ? `0 0 0 1px ${PALETTE.primaryGlow}` : 'none',
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, ...(active ? { background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}) }} translate="no">{item.icon}</span>
                                    {!sidebarCollapsed && item.label}
                                </button>
                            );
                        })}

                        <div style={{ height: 1, background: PALETTE.border, margin: '12px 0' }} />

                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: PALETTE.textMuted, padding: sidebarCollapsed ? '8px 4px' : '8px 12px', marginBottom: 4, display: sidebarCollapsed ? 'none' : 'block' }}>
                            Paramètres
                        </p>
                        {[
                            { icon: 'settings', label: 'Réglages' },
                            { icon: 'help_outline', label: 'Aide' },
                        ].map((item) => (
                            <button key={item.label} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: sidebarCollapsed ? '10px 14px' : '10px 14px',
                                borderRadius: 12, border: 'none', cursor: 'pointer',
                                fontSize: 14, fontWeight: 500, background: 'transparent',
                                color: PALETTE.textSecondary, transition: 'all 0.2s ease',
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                width: '100%', textAlign: 'left', fontFamily: 'inherit',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }} translate="no">{item.icon}</span>
                                {!sidebarCollapsed && item.label}
                            </button>
                        ))}
                    </nav>

                    {/* User */}
                    <div style={{
                        padding: sidebarCollapsed ? '16px 12px' : '16px',
                        borderTop: `1px solid ${PALETTE.border}`,
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 12,
                            background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.accent})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                            boxShadow: `0 4px 12px ${PALETTE.primaryGlow}`,
                        }}>YA</div>
                        {!sidebarCollapsed && (
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: PALETTE.text }}>Youssef Alami</p>
                                <p style={{ fontSize: 11, color: PALETTE.textMuted }}>Particulier</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ══════════ MAIN ══════════ */}
                <main style={{
                    marginLeft: sidebarCollapsed ? 72 : 260,
                    flex: 1,
                    transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex', flexDirection: 'column',
                }}>

                    {/* TOP BAR */}
                    <header style={{
                        height: 72,
                        ...GLASS.strong,
                        borderRadius: 0,
                        borderBottom: `1px solid ${PALETTE.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 32px',
                        position: 'sticky', top: 0, zIndex: 30,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: PALETTE.textSecondary, padding: 6, borderRadius: 10, display: 'flex',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22 }} translate="no">menu</span>
                            </button>

                            {/* Search */}
                            <div style={{
                                position: 'relative', display: 'flex', alignItems: 'center',
                                ...GLASS.subtle, borderRadius: 12,
                                padding: '8px 14px', width: 320,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: PALETTE.textMuted, marginRight: 8 }} translate="no">search</span>
                                <input type="text" placeholder="Rechercher..." style={{
                                    border: 'none', background: 'transparent', outline: 'none',
                                    fontSize: 14, color: PALETTE.text, width: '100%', fontFamily: 'inherit',
                                }} />
                                <kbd style={{
                                    fontSize: 11, fontFamily: 'inherit',
                                    background: 'rgba(255,255,255,0.7)',
                                    border: `1px solid ${PALETTE.border}`, borderRadius: 6,
                                    padding: '2px 6px', color: PALETTE.textMuted, marginLeft: 8,
                                }}>⌘F</kbd>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: PALETTE.textSecondary, padding: 8, borderRadius: 10,
                                display: 'flex', position: 'relative',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22 }} translate="no">notifications</span>
                                <span style={{
                                    position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                                    borderRadius: '50%', background: PALETTE.danger, border: '2px solid white',
                                }} />
                            </button>
                            <div style={{
                                width: 38, height: 38, borderRadius: 12,
                                background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.accent})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                boxShadow: `0 4px 12px ${PALETTE.primaryGlow}`,
                            }}>YA</div>
                        </div>
                    </header>

                    {/* PAGE CONTENT — centered & responsive */}
                    <div style={{
                        padding: '28px 32px',
                        maxWidth: 1100,
                        width: '100%',
                        margin: '0 auto',
                    }}>

                        {/* Tab Nav — glass */}
                        <div style={{
                            display: 'flex', gap: 4, marginBottom: 28,
                            ...GLASS.card,
                            borderRadius: 14, padding: 4, width: 'fit-content',
                        }}>
                            {([['dashboard', 'Dashboard'], ['profile', 'Profil Public'], ['components', 'Composants']] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    style={{
                                        padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                                        background: activeTab === key
                                            ? `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.indigo})`
                                            : 'transparent',
                                        color: activeTab === key ? '#fff' : PALETTE.textSecondary,
                                        transition: 'all 0.2s ease',
                                        boxShadow: activeTab === key ? `0 4px 14px ${PALETTE.primaryGlow}` : 'none',
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* ═══════ DASHBOARD TAB ═══════ */}
                        {activeTab === 'dashboard' && (
                            <div>
                                <div style={{ marginBottom: 24 }}>
                                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Dashboard</h1>
                                    <p style={{ fontSize: 14, color: PALETTE.textSecondary, marginTop: 4 }}>Bienvenue, Youssef. Voici vos statistiques.</p>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                                    {[
                                        { label: 'Vues ce mois', value: '1,247', trend: '+12.5%', up: true, icon: 'visibility', gradient: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.cyan})`, lightBg: PALETTE.primaryLight },
                                        { label: 'Contacts échangés', value: '38', trend: '+8', up: true, icon: 'swap_horiz', gradient: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.indigo})`, lightBg: PALETTE.accentLight },
                                        { label: 'Liens cliqués', value: '156', trend: '+23.1%', up: true, icon: 'touch_app', gradient: `linear-gradient(135deg, ${PALETTE.success}, ${PALETTE.cyan})`, lightBg: PALETTE.successLight },
                                        { label: 'Taux de conversion', value: '3.05%', trend: '-0.2%', up: false, icon: 'trending_up', gradient: `linear-gradient(135deg, ${PALETTE.warning}, #F97316)`, lightBg: PALETTE.warningLight },
                                    ].map((s) => (
                                        <div key={s.label} style={{
                                            ...GLASS.card,
                                            padding: '20px 22px', cursor: 'default',
                                            transition: 'all 0.25s ease',
                                        }}
                                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.08)`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                                <div style={{
                                                    width: 42, height: 42, borderRadius: 13,
                                                    background: s.gradient,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: `0 4px 12px ${s.lightBg}`,
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }} translate="no">{s.icon}</span>
                                                </div>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px',
                                                    background: s.up ? PALETTE.successLight : PALETTE.dangerLight,
                                                    color: s.up ? PALETTE.success : PALETTE.danger,
                                                }}>{s.trend}</span>
                                            </div>
                                            <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
                                            <p style={{ fontSize: 13, color: PALETTE.textMuted }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Chart + Contacts */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                                    <div style={{ ...GLASS.card, padding: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Vues par semaine</h3>
                                                <p style={{ fontSize: 13, color: PALETTE.textMuted, marginTop: 2 }}>Derniers 30 jours</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4, ...GLASS.subtle, borderRadius: 10, padding: 3 }}>
                                                {['7j', '30j', '90j'].map((p) => (
                                                    <button key={p} style={{
                                                        padding: '5px 12px', borderRadius: 8, border: 'none',
                                                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                                        background: p === '30j' ? `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.indigo})` : 'transparent',
                                                        color: p === '30j' ? '#fff' : PALETTE.textSecondary,
                                                        boxShadow: p === '30j' ? `0 2px 8px ${PALETTE.primaryGlow}` : 'none',
                                                    }}>{p}</button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Chart bars */}
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
                                            {[45, 62, 38, 75, 55, 90, 70, 85, 60, 95, 80, 65].map((h, i) => (
                                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '100%', height: `${h}%`, borderRadius: 8,
                                                        background: i === 9
                                                            ? `linear-gradient(180deg, ${PALETTE.primary}, ${PALETTE.accent})`
                                                            : `linear-gradient(180deg, ${PALETTE.primary}25, ${PALETTE.primary}10)`,
                                                        transition: 'all 0.3s ease', cursor: 'pointer',
                                                    }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(180deg, ${PALETTE.primary}, ${PALETTE.accent})`; }}
                                                        onMouseLeave={(e) => { if (i !== 9) e.currentTarget.style.background = `linear-gradient(180deg, ${PALETTE.primary}25, ${PALETTE.primary}10)`; }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                            {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((m) => (
                                                <span key={m} style={{ fontSize: 11, color: PALETTE.textMuted, flex: 1, textAlign: 'center' }}>{m}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Contacts */}
                                    <div style={{ ...GLASS.card, padding: 24 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Contacts récents</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {[
                                                { name: 'Marie Dupont', company: 'Acme Corp', time: '2h', color: PALETTE.primary },
                                                { name: 'Thomas Martin', company: 'TechStart', time: '5h', color: PALETTE.accent },
                                                { name: 'Sophie Legrand', company: 'DataFlow', time: 'Hier', color: PALETTE.cyan },
                                                { name: 'Lucas Bernard', company: 'FinTech SA', time: 'Hier', color: PALETTE.indigo },
                                                { name: 'Emma Rousseau', company: 'CreativeLab', time: '2j', color: PALETTE.success },
                                            ].map((c) => (
                                                <div key={c.name} style={{
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    padding: '10px 12px', borderRadius: 14,
                                                    transition: 'background 0.15s ease', cursor: 'pointer',
                                                }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: 12,
                                                        background: `linear-gradient(135deg, ${c.color}, ${c.color}AA)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                                                    }}>
                                                        {c.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                                                        <p style={{ fontSize: 11, color: PALETTE.textMuted }}>{c.company}</p>
                                                    </div>
                                                    <span style={{ fontSize: 11, color: PALETTE.textMuted }}>{c.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════ PROFILE TAB ═══════ */}
                        {activeTab === 'profile' && (
                            <div>
                                <div style={{ marginBottom: 24 }}>
                                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Profil Public</h1>
                                    <p style={{ fontSize: 14, color: PALETTE.textSecondary, marginTop: 4 }}>Aperçu de votre carte de visite digitale.</p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        width: 400,
                                        ...GLASS.card,
                                        borderRadius: 28,
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5)',
                                        overflow: 'hidden',
                                    }}>
                                        {/* Cover — taller to avoid cutting avatar */}
                                        <div style={{
                                            height: 160,
                                            background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.accent} 50%, ${PALETTE.indigo} 100%)`,
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}>
                                            {/* Glassmorphism circles for decoration */}
                                            <div style={{
                                                position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                                                borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                                            }} />
                                            <div style={{
                                                position: 'absolute', bottom: -20, left: 40, width: 80, height: 80,
                                                borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                                            }} />

                                            {/* Logo — glass pill, well-integrated */}
                                            <div style={{
                                                position: 'absolute', top: 16, right: 16,
                                                background: 'rgba(255,255,255,0.15)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                borderRadius: 10, padding: '8px 14px',
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                <img src="/logo-light.svg" alt="KlikNode" style={{ height: 16, filter: 'brightness(10)' }} />
                                                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.3px' }}>KlikNode</span>
                                            </div>
                                        </div>

                                        {/* Avatar — overlapping cover properly */}
                                        <div style={{ padding: '0 28px', marginTop: -48, position: 'relative', zIndex: 5 }}>
                                            <div style={{
                                                width: 96, height: 96, borderRadius: 24,
                                                border: '4px solid white',
                                                background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.accent})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: 32, fontWeight: 700,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            }}>
                                                YA
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div style={{ padding: '14px 28px 28px' }}>
                                            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Youssef Alami</h2>
                                            <p style={{ fontSize: 14, color: PALETTE.textSecondary, marginTop: 3 }}>Entrepreneur · KlikNode</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: PALETTE.textMuted }} translate="no">location_on</span>
                                                <span style={{ fontSize: 13, color: PALETTE.textMuted }}>Casablanca, Maroc</span>
                                            </div>

                                            {/* Buttons — futuristic gradients, NO black */}
                                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                                <button style={{
                                                    flex: 1, height: 46, borderRadius: 14, border: 'none',
                                                    background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.indigo})`,
                                                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                                                    boxShadow: `0 4px 16px ${PALETTE.primaryGlow}`,
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }} translate="no">person_add</span>
                                                    Enregistrer
                                                </button>
                                                <button style={{
                                                    flex: 1, height: 46, borderRadius: 14,
                                                    ...GLASS.subtle,
                                                    border: `1.5px solid ${PALETTE.border}`,
                                                    color: PALETTE.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }} translate="no">swap_horiz</span>
                                                    Échanger
                                                </button>
                                            </div>

                                            {/* Bio — glass card */}
                                            <div style={{
                                                marginTop: 20, padding: 18, borderRadius: 16,
                                                ...GLASS.subtle,
                                            }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: PALETTE.textMuted, marginBottom: 8 }}>À propos</p>
                                                <p style={{ fontSize: 14, lineHeight: 1.65, color: PALETTE.textSecondary }}>
                                                    Passionné par la tech et l&apos;innovation. Je développe des solutions NFC pour digitaliser les échanges professionnels.
                                                </p>
                                            </div>

                                            {/* Social Links     */}
                                            <div style={{ marginTop: 16 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: PALETTE.textMuted, marginBottom: 10 }}>Liens</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    {[
                                                        { icon: 'language', label: 'Website', url: 'kliknode.com', color: PALETTE.primary },
                                                        { icon: 'work', label: 'LinkedIn', url: 'linkedin.com/in/...', color: PALETTE.indigo },
                                                        { icon: 'photo_camera', label: 'Instagram', url: '@kliknode', color: PALETTE.accent },
                                                        { icon: 'mail', label: 'Email', url: 'contact@...', color: PALETTE.cyan },
                                                    ].map((link) => (
                                                        <div key={link.label} style={{
                                                            padding: '14px', borderRadius: 16,
                                                            ...GLASS.subtle,
                                                            cursor: 'pointer', transition: 'all 0.2s ease',
                                                        }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px ${link.color}15`; e.currentTarget.style.borderColor = `${link.color}40`; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                                                        >
                                                            <div style={{
                                                                width: 34, height: 34, borderRadius: 10,
                                                                background: `linear-gradient(135deg, ${link.color}15, ${link.color}08)`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                marginBottom: 10,
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: link.color }} translate="no">{link.icon}</span>
                                                            </div>
                                                            <p style={{ fontSize: 13, fontWeight: 600, color: PALETTE.text }}>{link.label}</p>
                                                            <p style={{ fontSize: 11, color: PALETTE.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <img src="/logo-dark.svg" alt="KlikNode" style={{ height: 14, opacity: 0.3 }} />
                                                    <span style={{ fontSize: 11, color: PALETTE.textMuted }}>Powered by KlikNode</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════ COMPONENTS TAB ═══════ */}
                        {activeTab === 'components' && (
                            <div>
                                <div style={{ marginBottom: 24 }}>
                                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Design System</h1>
                                    <p style={{ fontSize: 14, color: PALETTE.textSecondary, marginTop: 4 }}>Composants et palette KlikNode — Futuristic Glass Light</p>
                                </div>

                                {/* Colors */}
                                <div style={{ ...GLASS.card, padding: 24, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Palette de couleurs</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                                        {[
                                            { name: 'Primary', hex: PALETTE.primary },
                                            { name: 'Accent', hex: PALETTE.accent },
                                            { name: 'Indigo', hex: PALETTE.indigo },
                                            { name: 'Cyan', hex: PALETTE.cyan },
                                            { name: 'Success', hex: PALETTE.success },
                                            { name: 'Warning', hex: PALETTE.warning },
                                            { name: 'Danger', hex: PALETTE.danger },
                                        ].map((c) => (
                                            <div key={c.name} style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    width: '100%', paddingTop: '100%', borderRadius: 16, position: 'relative',
                                                    background: `linear-gradient(135deg, ${c.hex}, ${c.hex}CC)`,
                                                    boxShadow: `0 6px 20px ${c.hex}25`,
                                                }} />
                                                <p style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{c.name}</p>
                                                <p style={{ fontSize: 10, color: PALETTE.textMuted, fontFamily: 'monospace' }}>{c.hex}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Buttons — ALL futuristic, NO black */}
                                <div style={{ ...GLASS.card, padding: 24, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Boutons</h3>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.indigo})`,
                                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            boxShadow: `0 4px 14px ${PALETTE.primaryGlow}`,
                                        }}>Primary</button>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.indigo})`,
                                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            boxShadow: `0 4px 14px rgba(124,58,237,0.2)`,
                                        }}>Accent</button>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: `linear-gradient(135deg, ${PALETTE.cyan}, ${PALETTE.primary})`,
                                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            boxShadow: `0 4px 14px rgba(6,182,212,0.2)`,
                                        }}>Futuristic</button>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12,
                                            ...GLASS.subtle,
                                            border: `1.5px solid ${PALETTE.border}`,
                                            color: PALETTE.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        }}>Glass Outline</button>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: PALETTE.primaryLight, color: PALETTE.primary,
                                            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        }}>Soft</button>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: `linear-gradient(135deg, ${PALETTE.danger}, #DC2626)`,
                                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            boxShadow: `0 4px 14px rgba(239,68,68,0.2)`,
                                        }}>Danger</button>
                                        <button style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: `linear-gradient(135deg, ${PALETTE.success}, #059669)`,
                                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            boxShadow: `0 4px 14px rgba(16,185,129,0.2)`,
                                        }}>Success</button>
                                    </div>
                                </div>

                                {/* Inputs & Badges */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ ...GLASS.card, padding: 24 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Inputs</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 600, color: PALETTE.textSecondary, display: 'block', marginBottom: 6 }}>Email</label>
                                                <div style={{
                                                    ...GLASS.subtle, borderRadius: 12, padding: '0', overflow: 'hidden',
                                                    border: `1.5px solid ${PALETTE.border}`,
                                                }}>
                                                    <input type="email" placeholder="votre@email.com" style={{
                                                        width: '100%', padding: '11px 14px', border: 'none',
                                                        background: 'transparent', fontSize: 14, fontFamily: 'inherit',
                                                        outline: 'none', color: PALETTE.text, boxSizing: 'border-box',
                                                    }} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 600, color: PALETTE.textSecondary, display: 'block', marginBottom: 6 }}>Mot de passe</label>
                                                <div style={{
                                                    ...GLASS.subtle, borderRadius: 12, padding: '0', overflow: 'hidden',
                                                    border: `1.5px solid ${PALETTE.border}`,
                                                }}>
                                                    <input type="password" placeholder="••••••••" style={{
                                                        width: '100%', padding: '11px 14px', border: 'none',
                                                        background: 'transparent', fontSize: 14, fontFamily: 'inherit',
                                                        outline: 'none', color: PALETTE.text, boxSizing: 'border-box',
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ ...GLASS.card, padding: 24 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Badges</h3>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {[
                                                { label: 'Active', bg: PALETTE.successLight, color: PALETTE.success },
                                                { label: 'En stock', bg: PALETTE.primaryLight, color: PALETTE.primary },
                                                { label: 'Réservée', bg: PALETTE.warningLight, color: '#D97706' },
                                                { label: 'Perdue', bg: PALETTE.dangerLight, color: PALETTE.danger },
                                                { label: 'Beta', bg: PALETTE.accentLight, color: PALETTE.accent },
                                                { label: 'NFC', bg: PALETTE.cyanLight, color: PALETTE.cyan },
                                            ].map((b) => (
                                                <span key={b.label} style={{
                                                    fontSize: 12, fontWeight: 600, borderRadius: 20,
                                                    padding: '5px 14px', background: b.bg, color: b.color,
                                                }}>{b.label}</span>
                                            ))}
                                        </div>

                                        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Typographie</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>Heading 1</p>
                                            <p style={{ fontSize: 18, fontWeight: 600 }}>Heading 2</p>
                                            <p style={{ fontSize: 14, color: PALETTE.textSecondary }}>Body text — secondary</p>
                                            <p style={{ fontSize: 12, color: PALETTE.textMuted }}>Caption — muted</p>
                                        </div>

                                        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Glass Cards</h3>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <div style={{ ...GLASS.subtle, padding: 14, flex: 1, borderRadius: 14, textAlign: 'center' }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: PALETTE.textSecondary }}>Subtle</p>
                                            </div>
                                            <div style={{ ...GLASS.card, padding: 14, flex: 1, textAlign: 'center' }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: PALETTE.textSecondary }}>Card</p>
                                            </div>
                                            <div style={{ ...GLASS.strong, padding: 14, flex: 1, textAlign: 'center' }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: PALETTE.textSecondary }}>Strong</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
