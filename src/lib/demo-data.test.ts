import { describe, it, expect } from 'vitest';
import { getDemoUser, demoUsers } from './demo-data';

describe('getDemoUser', () => {
    it('returns the correct user when a valid ID is provided', () => {
        const userId = 'u1';
        const expectedUser = demoUsers.find(u => u.id === userId);
        const result = getDemoUser(userId);

        expect(result).toBeDefined();
        expect(result).toEqual(expectedUser);
        expect(result?.id).toBe(userId);
        expect(result?.name).toBe('Alex');
    });

    it('returns the correct user for another valid ID', () => {
        const userId = 'u2';
        const expectedUser = demoUsers.find(u => u.id === userId);
        const result = getDemoUser(userId);

        expect(result).toBeDefined();
        expect(result).toEqual(expectedUser);
        expect(result?.id).toBe(userId);
        expect(result?.name).toBe('Jamie');
    });

    it('returns undefined when a non-existent ID is provided', () => {
        const result = getDemoUser('u999');
        expect(result).toBeUndefined();
    });

    it('returns undefined when an empty string is provided', () => {
        const result = getDemoUser('');
        expect(result).toBeUndefined();
    });

    it('returns undefined when ID does not match case', () => {
        // IDs are 'u1', 'u2', etc. Let's test with uppercase
        const result = getDemoUser('U1');
        expect(result).toBeUndefined();
    });
});
