import { parseIndianPrice } from './parser';

describe('parseIndianPrice', () => {
    // 1. Happy Paths (Single Prices)
    test('parses lakh variations correctly', () => {
        expect(parseIndianPrice('5 lakh')).toEqual({ value: 500000 });
        expect(parseIndianPrice('5 lac')).toEqual({ value: 500000 });
        expect(parseIndianPrice('5L')).toEqual({ value: 500000 });
        expect(parseIndianPrice('5.5 lakh')).toEqual({ value: 550000 });
    });

    test('parses crore variations correctly', () => {
        expect(parseIndianPrice('1.2 crore')).toEqual({ value: 12000000 });
        expect(parseIndianPrice('1.2 cr')).toEqual({ value: 12000000 });
        expect(parseIndianPrice('10 cr')).toEqual({ value: 100000000 });
    });

    test('parses raw and formatted numbers correctly', () => {
        expect(parseIndianPrice('₹8,50,000')).toEqual({ value: 850000 });
        expect(parseIndianPrice('850000')).toEqual({ value: 850000 });
        expect(parseIndianPrice('rs 10,000')).toEqual({ value: 10000 });
    });

    test('handles case insensitivity correctly', () => {
        expect(parseIndianPrice('5 LAKH')).toEqual({ value: 500000 });
        expect(parseIndianPrice('5l')).toEqual({ value: 500000 });
        expect(parseIndianPrice('1.2 CR')).toEqual({ value: 12000000 });
        expect(parseIndianPrice('1.2 Crore')).toEqual({ value: 12000000 });
    });

    test('handles prefix qualifiers correctly', () => {
        expect(parseIndianPrice('under 5 lakh')).toEqual({ value: 500000 });
        expect(parseIndianPrice('below 1.2 cr')).toEqual({ value: 12000000 });
        expect(parseIndianPrice('up to 8L')).toEqual({ value: 800000 });
        expect(parseIndianPrice('upto ₹8,50,000')).toEqual({ value: 850000 });
    });

    test('parses ranges correctly and inherits unit suffix', () => {
        expect(parseIndianPrice('5 to 8 lakh')).toEqual({ min: 500000, max: 800000 });
        expect(parseIndianPrice('5L - 8L')).toEqual({ min: 500000, max: 800000 });
        expect(parseIndianPrice('5 lakh to 8 crore')).toEqual({ min: 500000, max: 80000000 });
        expect(parseIndianPrice('between 10 and 15 cr')).toEqual({ min: 100000000, max: 150000000 });
    });

    test('handles invalid inputs cleanly without crashing', () => {
        expect(() => parseIndianPrice(null)).toThrow();
        expect(() => parseIndianPrice(undefined)).toThrow();
        expect(() => parseIndianPrice('')).toThrow();
        expect(() => parseIndianPrice('   ')).toThrow();
        expect(() => parseIndianPrice('garbage')).toThrow();
        expect(() => parseIndianPrice('1.2.3 lakh')).toThrow();
        expect(() => parseIndianPrice('5 lakh to 4 lakh')).toThrow('Invalid range'); // min > max
    });
});
