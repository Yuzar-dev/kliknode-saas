import prisma from '../config/database';
import logger from '../utils/logger.util';

export const DEFAULT_SKU = 'NFC-NTAG213';

/**
 * Génère un UID hexadécimal de 14 caractères (7 octets) uniforme sur toute la plateforme
 * Exemple : 04A3B2C1D4E5F6
 */
export function generateRealisticUid(prefix = '04'): string {
    const cleanPrefix = prefix.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().padStart(2, '0').slice(0, 2);
    const bytes = [cleanPrefix];
    for (let b = 0; b < 6; b++) {
        bytes.push(
            Math.floor(Math.random() * 256)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase()
        );
    }
    return bytes.join('');
}

/**
 * Synchronise intégralement la table `inventory` à partir de `physical_cards`.
 * Garantit que les compteurs entre :
 *  - Gestion des Stocks (/admin/inventory)
 *  - Générateur de Lots (/admin/batch-generator)
 *  - Escale Opérateur (/operator)
 * sont strictement identiques à l'unité près :
 *  - Qty Physique = Total des cartes (En stock + Réservées B2B + Pairées)
 *  - Qty Réservée = Cartes réellement attribuées (Réservées B2B + Pairées)
 *  - Qty Disponible = Cartes Vierges en stock (in_stock)
 */
export async function syncAllInventoryFromCardsAndOrders(): Promise<void> {
    try {
        // 1. Normaliser les cartes physiques qui n'ont pas de SKU ou pas de batchTag
        await prisma.physicalCard.updateMany({
            where: { OR: [{ sku: null }, { sku: '' }] },
            data: { sku: DEFAULT_SKU }
        });

        await prisma.physicalCard.updateMany({
            where: {
                OR: [{ batchTag: null }, { batchTag: '' }],
                warehouse: 'paris'
            },
            data: { batchTag: 'LOT-OPERATEUR-PARIS' }
        });

        await prisma.physicalCard.updateMany({
            where: {
                OR: [{ batchTag: null }, { batchTag: '' }],
                warehouse: 'oujda'
            },
            data: { batchTag: 'LOT-OPERATEUR-OUJDA' }
        });

        // 2. Compter toutes les cartes physiques par (sku, warehouse, status)
        const cardGroups = await prisma.physicalCard.groupBy({
            by: ['sku', 'warehouse', 'status'],
            _count: { id: true }
        });

        // 3. Agréger les compteurs par couple (sku, warehouse)
        type Bucket = {
            sku: string;
            warehouse: 'paris' | 'oujda';
            inStock: number;
            reserved: number;
            paired: number;
            lost: number;
        };

        const buckets = new Map<string, Bucket>();

        for (const cg of cardGroups) {
            const sku = (cg.sku || DEFAULT_SKU).trim().toUpperCase();
            const warehouse = cg.warehouse;
            const key = `${sku}::${warehouse}`;
            if (!buckets.has(key)) {
                buckets.set(key, {
                    sku,
                    warehouse,
                    inStock: 0,
                    reserved: 0,
                    paired: 0,
                    lost: 0
                });
            }
            const b = buckets.get(key)!;
            const count = cg._count.id;
            if (cg.status === 'in_stock') b.inStock += count;
            else if (cg.status === 'reserved') b.reserved += count;
            else if (cg.status === 'paired') b.paired += count;
            else if (cg.status === 'lost') b.lost += count;
        }

        // 4. Mettre à jour la table `inventory` pour qu'elle reflète exactement les cartes physiques
        const existingInventory = await prisma.inventory.findMany();
        const processedKeys = new Set<string>();

        for (const [key, b] of buckets.entries()) {
            processedKeys.add(key);
            // Total physique = toutes les cartes (in_stock + reserved + paired + lost)
            // Qty Réservée = uniquement les cartes réellement réservées B2B ou pairées (ou perdues)
            // Qty Disponible = uniquement les cartes vierges en stock (in_stock)
            const quantityPhysical = b.inStock + b.reserved + b.paired + b.lost;
            const quantityReserved = b.reserved + b.paired + b.lost;
            const quantityAvailable = b.inStock;

            await prisma.inventory.upsert({
                where: {
                    sku_warehouse: {
                        sku: b.sku,
                        warehouse: b.warehouse
                    }
                },
                update: {
                    quantityPhysical,
                    quantityReserved,
                    quantityAvailable,
                    lastAdjustmentAt: new Date()
                },
                create: {
                    sku: b.sku,
                    warehouse: b.warehouse,
                    quantityPhysical,
                    quantityReserved,
                    quantityAvailable,
                    lastAdjustmentAt: new Date()
                }
            });
        }

        // Supprimer les lignes d'inventaire fantômes qui n'ont plus aucune carte physique associée
        const orphanIds = existingInventory
            .filter(inv => !processedKeys.has(`${inv.sku.trim().toUpperCase()}::${inv.warehouse}`))
            .map(inv => inv.id);

        if (orphanIds.length > 0) {
            await prisma.inventory.deleteMany({
                where: { id: { in: orphanIds } }
            });
        }
    } catch (error) {
        logger.error('Error in syncAllInventoryFromCardsAndOrders:', error);
    }
}

/**
 * Ajuste le nombre réel de `PhysicalCard` pour un couple (sku, warehouse) afin d'atteindre `targetPhysicalQty`,
 * puis synchronise la table `inventory`.
 */
export async function setPhysicalCardsCountForSkuWarehouse(
    sku: string,
    warehouse: 'paris' | 'oujda',
    targetPhysicalQty: number,
    customBatchTag?: string
): Promise<void> {
    const cleanSku = (sku || DEFAULT_SKU).trim().toUpperCase();

    const currentCount = await prisma.physicalCard.count({
        where: { sku: cleanSku, warehouse }
    });

    const delta = targetPhysicalQty - currentCount;

    if (delta > 0) {
        const batchTag = customBatchTag || `STOCK-${cleanSku}-${warehouse.toUpperCase()}`;
        const cardsToCreate = [];
        for (let i = 0; i < delta; i++) {
            cardsToCreate.push({
                uid: generateRealisticUid('04'),
                sku: cleanSku,
                batchTag,
                warehouse,
                status: 'in_stock' as const
            });
        }
        await prisma.physicalCard.createMany({
            data: cardsToCreate,
            skipDuplicates: true
        });
    } else if (delta < 0) {
        const toRemoveCount = Math.abs(delta);
        const removableCards = await prisma.physicalCard.findMany({
            where: {
                sku: cleanSku,
                warehouse,
                pairedCardId: null
            },
            orderBy: [
                { status: 'asc' },
                { createdAt: 'desc' }
            ],
            take: toRemoveCount,
            select: { id: true }
        });

        if (removableCards.length > 0) {
            await prisma.physicalCard.deleteMany({
                where: { id: { in: removableCards.map(c => c.id) } }
            });
        }
    }

    await syncAllInventoryFromCardsAndOrders();
}
