import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.util';

export type CrmProvider = 'tiime' | 'hubspot' | 'pipedrive' | 'salesforce' | 'webhook';

export interface CrmConfig {
    provider: CrmProvider;
    enabled: boolean;
    autoSync: boolean;
    apiKey?: string;
    webhookUrl?: string;
    tiimeCompanyId?: string;
    lastSyncAt?: string;
    lastSyncStatus?: 'success' | 'error';
    lastSyncMessage?: string;
    totalSynced?: number;
    updatedAt: string;
}

export interface LeadPayload {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    companyName?: string | null;
    notes?: string | null;
    source?: string | null;
    createdAt?: Date | string;
    ownerName?: string;
}

const DATA_DIR = process.env.VERCEL ? '/tmp/kliknode-data' : path.join(process.cwd(), 'data');
const CRM_CONFIG_FILE = path.join(DATA_DIR, 'crm-configs.json');

function ensureDataFile(): Record<string, CrmConfig> {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(CRM_CONFIG_FILE)) {
            fs.writeFileSync(CRM_CONFIG_FILE, JSON.stringify({}, null, 2), 'utf8');
            return {};
        }
        const raw = fs.readFileSync(CRM_CONFIG_FILE, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (err) {
        logger.error('Error reading CRM config file:', err);
        return {};
    }
}

function saveDataFile(store: Record<string, CrmConfig>) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(CRM_CONFIG_FILE, JSON.stringify(store, null, 2), 'utf8');
    } catch (err) {
        logger.error('Error writing CRM config file:', err);
    }
}

export function getCrmConfig(scopeKey: string): CrmConfig {
    const store = ensureDataFile();
    return store[scopeKey] || {
        provider: 'tiime',
        enabled: false,
        autoSync: true,
        apiKey: '',
        webhookUrl: '',
        tiimeCompanyId: '',
        totalSynced: 0,
        updatedAt: new Date().toISOString(),
    };
}

export function saveCrmConfig(scopeKey: string, partial: Partial<CrmConfig>): CrmConfig {
    const store = ensureDataFile();
    const existing = getCrmConfig(scopeKey);
    const updated: CrmConfig = {
        ...existing,
        ...partial,
        updatedAt: new Date().toISOString(),
    };
    store[scopeKey] = updated;
    saveDataFile(store);
    return updated;
}

/**
 * Envoie un contact vers le CRM configuré (Tiime, HubSpot, Pipedrive, Salesforce/Webhook)
 */
export async function pushLeadToCrm(
    scopeKey: string,
    lead: LeadPayload
): Promise<{ success: boolean; provider: CrmProvider; message: string }> {
    const config = getCrmConfig(scopeKey);

    if (!config.enabled) {
        return {
            success: false,
            provider: config.provider,
            message: 'L\'intégration CRM n\'est pas activée.',
        };
    }

    const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'Contact KlikNode';
    const clientDisplayName = lead.companyName
        ? `${lead.companyName} (${fullName})`
        : fullName;

    try {
        // 1. TIIME.FR (via connecteur Make.com / Webhook ou API Partenaire Tiime)
        if (config.provider === 'tiime') {
            if (!config.webhookUrl && !config.apiKey) {
                return {
                    success: false,
                    provider: 'tiime',
                    message: 'Veuillez renseigner l\'URL Webhook Make/Tiime ou votre clé API Tiime.',
                };
            }

            const tiimePayload = {
                event: 'kliknode.lead.captured',
                provider: 'tiime',
                tiime_client: {
                    name: clientDisplayName,
                    company_name: lead.companyName || fullName,
                    is_professional: Boolean(lead.companyName),
                    first_name: lead.firstName || '',
                    last_name: lead.lastName || '',
                    email: lead.email || '',
                    phone: lead.phone || '',
                    comments: lead.notes || `Capturé via carte NFC KlikNode (${lead.ownerName || 'Équipe'})`,
                    tags: ['KlikNode', 'NFC'],
                    tiime_company_id: config.tiimeCompanyId || undefined,
                },
                raw_lead: lead,
                synced_at: new Date().toISOString(),
            };

            if (config.apiKey && config.tiimeCompanyId && !config.webhookUrl) {
                // Appel direct à l'API Tiime (sans passer par Make)
                const tiimeApiUrl = `https://chronos-api.tiime-apps.com/v1/companies/${encodeURIComponent(config.tiimeCompanyId)}/clients`;
                const response = await fetch(tiimeApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        name: clientDisplayName,
                        professional: Boolean(lead.companyName),
                        emails: lead.email ? [lead.email] : [],
                        phone: lead.phone || '',
                        comments: lead.notes || `Capturé via carte NFC KlikNode (${lead.ownerName || 'Équipe'})`,
                    }),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API Tiime Directe (HTTP ${response.status}): ${errText.slice(0, 120)}`);
                }
            } else if (config.webhookUrl) {
                const response = await fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
                    },
                    body: JSON.stringify(tiimePayload),
                });

                if (!response.ok) {
                    throw new Error(`Erreur Webhook Tiime (HTTP ${response.status})`);
                }
            }

            saveCrmConfig(scopeKey, {
                lastSyncAt: new Date().toISOString(),
                lastSyncStatus: 'success',
                lastSyncMessage: `Contact "${clientDisplayName}" synchronisé vers Tiime`,
                totalSynced: (config.totalSynced || 0) + 1,
            });

            return {
                success: true,
                provider: 'tiime',
                message: `Contact "${clientDisplayName}" envoyé vers Tiime avec succès.`,
            };
        }

        // 2. HUBSPOT CRM (API officielle v3 Contacts ou Webhook)
        if (config.provider === 'hubspot') {
            if (config.apiKey) {
                const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        properties: {
                            firstname: lead.firstName || '',
                            lastname: lead.lastName || '',
                            email: lead.email || '',
                            phone: lead.phone || '',
                            company: lead.companyName || '',
                            hs_lead_status: 'NEW',
                        },
                    }),
                });

                // 409 Conflict sur HubSpot signifie que le contact existe déjà, ce qui est OK
                if (!response.ok && response.status !== 409) {
                    const errText = await response.text();
                    throw new Error(`HubSpot API (${response.status}): ${errText.slice(0, 120)}`);
                }
            } else if (config.webhookUrl) {
                const response = await fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: 'hubspot', lead }),
                });
                if (!response.ok) throw new Error(`Webhook HubSpot HTTP ${response.status}`);
            } else {
                return {
                    success: false,
                    provider: 'hubspot',
                    message: 'Clé Private App HubSpot (pat-...) ou URL Webhook requise.',
                };
            }

            saveCrmConfig(scopeKey, {
                lastSyncAt: new Date().toISOString(),
                lastSyncStatus: 'success',
                lastSyncMessage: `Contact "${fullName}" synchronisé vers HubSpot`,
                totalSynced: (config.totalSynced || 0) + 1,
            });

            return {
                success: true,
                provider: 'hubspot',
                message: `Contact "${fullName}" synchronisé sur HubSpot CRM.`,
            };
        }

        // 3. PIPEDRIVE CRM (API v1 Persons)
        if (config.provider === 'pipedrive') {
            if (config.apiKey) {
                const url = `https://api.pipedrive.com/v1/persons?api_token=${encodeURIComponent(config.apiKey)}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fullName,
                        email: lead.email ? [{ value: lead.email, primary: true, label: 'work' }] : [],
                        phone: lead.phone ? [{ value: lead.phone, primary: true, label: 'work' }] : [],
                    }),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Pipedrive API (${response.status}): ${errText.slice(0, 120)}`);
                }
            } else if (config.webhookUrl) {
                const response = await fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: 'pipedrive', lead }),
                });
                if (!response.ok) throw new Error(`Webhook Pipedrive HTTP ${response.status}`);
            } else {
                return {
                    success: false,
                    provider: 'pipedrive',
                    message: 'Token API Pipedrive ou URL Webhook requis.',
                };
            }

            saveCrmConfig(scopeKey, {
                lastSyncAt: new Date().toISOString(),
                lastSyncStatus: 'success',
                lastSyncMessage: `Contact "${fullName}" synchronisé vers Pipedrive`,
                totalSynced: (config.totalSynced || 0) + 1,
            });

            return {
                success: true,
                provider: 'pipedrive',
                message: `Contact "${fullName}" créé dans Pipedrive.`,
            };
        }

        // 4. SALESFORCE / WEBHOOK UNIVERSEL (Make / Zapier / n8n)
        if (config.provider === 'salesforce' || config.provider === 'webhook') {
            if (!config.webhookUrl) {
                return {
                    success: false,
                    provider: config.provider,
                    message: 'URL du Webhook (Make, Zapier, Salesforce) requise.',
                };
            }

            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
                },
                body: JSON.stringify({
                    event: 'kliknode.lead.captured',
                    provider: config.provider,
                    contact: {
                        firstName: lead.firstName || '',
                        lastName: lead.lastName || '',
                        fullName,
                        email: lead.email || '',
                        phone: lead.phone || '',
                        companyName: lead.companyName || '',
                        notes: lead.notes || '',
                        source: lead.source || 'nfc_tap',
                        createdAt: lead.createdAt || new Date().toISOString(),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Webhook HTTP ${response.status}`);
            }

            saveCrmConfig(scopeKey, {
                lastSyncAt: new Date().toISOString(),
                lastSyncStatus: 'success',
                lastSyncMessage: `Contact "${fullName}" envoyé au Webhook CRM`,
                totalSynced: (config.totalSynced || 0) + 1,
            });

            return {
                success: true,
                provider: config.provider,
                message: `Contact "${fullName}" synchronisé via Webhook.`,
            };
        }

        return {
            success: false,
            provider: config.provider,
            message: 'Fournisseur CRM non reconnu.',
        };
    } catch (error: any) {
        logger.error(`CRM sync error (${config.provider}):`, error);
        saveCrmConfig(scopeKey, {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'error',
            lastSyncMessage: error.message || 'Erreur lors de la synchronisation CRM',
        });
        return {
            success: false,
            provider: config.provider,
            message: error.message || 'Erreur lors de la synchronisation avec le CRM',
        };
    }
}

/**
 * Synchronise une liste de contacts en lot vers le CRM configuré
 */
export async function syncLeadsBatchToCrm(
    scopeKey: string,
    leads: LeadPayload[]
): Promise<{ syncedCount: number; failedCount: number; message: string }> {
    const config = getCrmConfig(scopeKey);
    if (!config.enabled) {
        return {
            syncedCount: 0,
            failedCount: leads.length,
            message: 'Veuillez d\'abord activer et enregistrer votre configuration CRM.',
        };
    }

    let syncedCount = 0;
    let failedCount = 0;
    let lastError = '';

    for (const lead of leads) {
        const res = await pushLeadToCrm(scopeKey, lead);
        if (res.success) {
            syncedCount++;
        } else {
            failedCount++;
            lastError = res.message;
        }
    }

    const message = syncedCount > 0
        ? `${syncedCount} contact(s) synchronisé(s) vers ${config.provider.toUpperCase()}${failedCount > 0 ? ` (${failedCount} échec(s))` : ''}.`
        : lastError || 'Aucun contact n\'a pu être synchronisé.';

    return { syncedCount, failedCount, message };
}
