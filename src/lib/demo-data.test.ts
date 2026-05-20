import { describe, it, expect } from 'vitest';
import { getDemoUser } from './demo-data';

describe('getDemoUser', () => {
    it('should return the correct user for an existing id', () => {
        const user = getDemoUser('u1');
        expect(user).toBeDefined();
        expect(user?.id).toBe('u1');
        expect(user?.name).toBe('Alex');
        expect(user?.role).toBe('admin');
    });

    it('should return another existing user correctly', () => {
        const user = getDemoUser('u2');
        expect(user).toBeDefined();
        expect(user?.id).toBe('u2');
        expect(user?.name).toBe('Jamie');
        expect(user?.role).toBe('member');
    });

    it('should return undefined for a non-existent id', () => {
        const user = getDemoUser('u999');
        expect(user).toBeUndefined();
    });

    it('should return undefined for an empty string id', () => {
        const user = getDemoUser('');
        expect(user).toBeUndefined();
    });
});
