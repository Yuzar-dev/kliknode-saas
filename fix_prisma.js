const fs = require('fs');
const path = require('path');

const files = [
    'frontend/server/controllers/company/departments.controller.ts',
    'frontend/server/controllers/company/leads.controller.ts',
    'frontend/server/controllers/public/card.controller.ts',
    'frontend/server/controllers/company/employees.controller.ts',
    'frontend/server/controllers/company/branding.controller.ts',
    'frontend/server/controllers/company/billing.controller.ts',
    'frontend/server/controllers/company/dashboard.controller.ts',
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // Remplacer import { PrismaClient } from '@prisma/client';
    content = content.replace(/import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"];\s*/g, '');

    // Remplacer const prisma = new PrismaClient();
    content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\);\s*/g, '');

    // Ajouter l'import custom s'il n'y est pas
    if (!content.includes("import prisma from '../../config/database';")) {
        content = "import prisma from '../../config/database';\n" + content;
    }

    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
});
