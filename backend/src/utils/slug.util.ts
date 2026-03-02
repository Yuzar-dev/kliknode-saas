/**
 * Génère un slug à partir d'une chaîne de caractères
 * Exemple: "John Doe" => "john-doe"
 */
export const generateSlug = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Remplacer espaces par -
        .replace(/[^\w\-]+/g, '') // Supprimer caractères spéciaux
        .replace(/\-\-+/g, '-') // Remplacer -- par -
        .replace(/^-+/, '') // Trim - du début
        .replace(/-+$/, ''); // Trim - de la fin
};

/**
 * Génère un slug unique avec timestamp
 */
export const generateUniqueSlug = (text: string): string => {
    const baseSlug = generateSlug(text);
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
};
