/**
 * Helper to parse a single numeric price phrase (e.g. "5 lakh", "1.2 cr", "850000", "₹8,50,000")
 */
function parseSinglePrice(input: string, defaultMultiplier: number = 1): number {
    let str = input.trim().toLowerCase();
    
    // Remove rupee symbol, commas, dollar sign, rs, rupees
    str = str.replace(/[₹$,]/g, '');
    str = str.replace(/\brs\.?\s*/g, '');
    str = str.replace(/\brupees\b\s*/g, '');
    
    // Remove common prefix qualifiers
    str = str.replace(/\b(under|below|up\s*to|upto|around|about|approx|approximately)\b/g, '');
    str = str.trim();
    
    if (!str) {
        throw new Error("Empty price input");
    }
    
    // Match a valid float followed by an optional unit suffix
    const match = str.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(lakhs?|lacs?|l|crores?|cr)?$/);
    if (!match) {
        throw new Error(`Unable to parse price segment: "${input}"`);
    }
    
    const numValue = parseFloat(match[1]);
    if (isNaN(numValue)) {
        throw new Error(`Invalid numeric value in: "${input}"`);
    }
    
    const unit = match[2];
    let multiplier = defaultMultiplier;
    
    if (unit) {
        if (/^(lakhs?|lacs?|l)$/.test(unit)) {
            multiplier = 100000;
        } else if (/^(crores?|cr)$/.test(unit)) {
            multiplier = 10000000;
        }
    }
    
    return numValue * multiplier;
}

/**
 * Parses an Indian price string into a single value or range of values.
 * Returns { value } or { min, max }
 */
export function parseIndianPrice(input: any): { value: number } | { min: number, max: number } {
    if (input === null || input === undefined) {
        throw new Error("Price input is null or undefined");
    }
    
    if (typeof input !== 'string') {
        throw new Error("Price input must be a string");
    }
    
    const originalStr = input.trim();
    if (!originalStr) {
        throw new Error("Price input is empty or blank");
    }
    
    // Check if it's a range (e.g. "5 to 8 lakh", "5l - 8l", "between 5 and 8 lakh")
    let cleanStr = originalStr.toLowerCase().trim();
    if (cleanStr.startsWith("between")) {
        cleanStr = cleanStr.substring(7).trim();
    }
    // Remove "up to" or "upto" first to prevent splitting on "to"
    cleanStr = cleanStr.replace(/\b(up\s*to|upto)\b/g, '').trim();
    
    // Split on range delimiters: "to", "and", "-", "till"
    const rangeRegex = /\s+(?:to|and|till)\s+|\s*-\s+/;
    const parts = cleanStr.split(rangeRegex);
    
    if (parts.length === 2) {
        // Range logic
        const rawPart1 = parts[0].trim();
        const rawPart2 = parts[1].trim();
        
        // Parse the second part first to see if it defines a multiplier/unit
        const part2SuffixMatch = rawPart2.match(/[a-z]+$/);
        let part2UnitMultiplier = 1;
        if (part2SuffixMatch) {
            const suffix = part2SuffixMatch[0];
            if (/^(lakhs?|lacs?|l)$/.test(suffix)) {
                part2UnitMultiplier = 100000;
            } else if (/^(crores?|cr)$/.test(suffix)) {
                part2UnitMultiplier = 10000000;
            }
        }
        
        const max = parseSinglePrice(rawPart2);
        
        // Parse part1 using part2's unit multiplier as default multiplier
        const min = parseSinglePrice(rawPart1, part2UnitMultiplier);
        
        if (min > max) {
            throw new Error(`Invalid range: min value (${min}) is greater than max value (${max})`);
        }
        
        return { min, max };
    } else if (parts.length === 1) {
        // Single price logic
        const value = parseSinglePrice(cleanStr);
        return { value };
    } else {
        throw new Error("Invalid price format: multiple range delimiters found");
    }
}
