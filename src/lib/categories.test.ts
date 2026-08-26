/**
 * Unit tests for category data-access helpers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories } from '../../db/schema';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('categories data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all categories ordered by name', async () => {
        // Insert categories in reverse alphabetical order to verify ordering
        await db.insert(categories).values({ name: 'Strategy', description: 'Strategy games' });
        await db.insert(categories).values({ name: 'Action', description: 'Action games' });
        await db.insert(categories).values({ name: 'RPG', description: 'Role-playing games' });

        const all = await getAllCategories(db);

        expect(all.map((c) => c.name)).toEqual(['Action', 'RPG', 'Strategy']);
        expect(all[0]).toEqual({ id: expect.any(Number), name: 'Action' });
    });

    it('returns empty array when no categories exist', async () => {
        const all = await getAllCategories(db);
        expect(all).toEqual([]);
    });
});
