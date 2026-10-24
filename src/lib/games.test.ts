import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});

describe('getFilteredGames', () => {
    let db: Database;
    let strategyId: number;
    let actionId: number;
    let pub1Id: number;
    let pub2Id: number;

    beforeEach(async () => {
        db = await createTestDatabase();

        // Set up test data with multiple categories and publishers
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'Strategy games' })
            .returning({ id: categories.id });
        const [action] = await db
            .insert(categories)
            .values({ name: 'Action', description: 'Action games' })
            .returning({ id: categories.id });

        const [publisher1] = await db
            .insert(publishers)
            .values({ name: 'Publisher One', description: 'First publisher' })
            .returning({ id: publishers.id });
        const [publisher2] = await db
            .insert(publishers)
            .values({ name: 'Publisher Two', description: 'Second publisher' })
            .returning({ id: publishers.id });

        strategyId = strategy.id;
        actionId = action.id;
        pub1Id = publisher1.id;
        pub2Id = publisher2.id;

        // Insert games with different combinations
        await db.insert(games).values({
            title: 'Strategy Game 1',
            description: 'A strategy game from publisher 1',
            starRating: 4.5,
            categoryId: strategyId,
            publisherId: pub1Id,
        });
        await db.insert(games).values({
            title: 'Strategy Game 2',
            description: 'A strategy game from publisher 2',
            starRating: 4.0,
            categoryId: strategyId,
            publisherId: pub2Id,
        });
        await db.insert(games).values({
            title: 'Action Game 1',
            description: 'An action game from publisher 1',
            starRating: 3.8,
            categoryId: actionId,
            publisherId: pub1Id,
        });
        await db.insert(games).values({
            title: 'Action Game 2',
            description: 'An action game from publisher 2',
            starRating: 4.2,
            categoryId: actionId,
            publisherId: pub2Id,
        });
    });

    it('returns all games when no filters are provided', async () => {
        const result = await getFilteredGames(db, {});
        expect(result).toHaveLength(4);
        expect(result.map((g) => g.title)).toEqual([
            'Action Game 1',
            'Action Game 2',
            'Strategy Game 1',
            'Strategy Game 2',
        ]);
    });

    it('filters games by a single category', async () => {
        const result = await getFilteredGames(db, {
            categoryIds: [strategyId],
        });
        expect(result).toHaveLength(2);
        expect(result.map((g) => g.title)).toEqual(['Strategy Game 1', 'Strategy Game 2']);
    });

    it('filters games by multiple categories', async () => {
        const result = await getFilteredGames(db, {
            categoryIds: [strategyId, actionId],
        });
        expect(result).toHaveLength(4);
    });

    it('filters games by a single publisher', async () => {
        const result = await getFilteredGames(db, {
            publisherIds: [pub1Id],
        });
        expect(result).toHaveLength(2);
        expect(result.map((g) => g.title)).toEqual(['Action Game 1', 'Strategy Game 1']);
    });

    it('filters games by multiple publishers', async () => {
        const result = await getFilteredGames(db, {
            publisherIds: [pub1Id, pub2Id],
        });
        expect(result).toHaveLength(4);
    });

    it('filters games by both category and publisher', async () => {
        const result = await getFilteredGames(db, {
            categoryIds: [strategyId],
            publisherIds: [pub1Id],
        });
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Strategy Game 1');
    });

    it('returns empty array when filters match no games', async () => {
        const result = await getFilteredGames(db, {
            categoryIds: [99999],
        });
        expect(result).toEqual([]);
    });

    it('returns games ordered by title', async () => {
        const result = await getFilteredGames(db, {});
        const titles = result.map((g) => g.title);
        const sortedTitles = [...titles].sort();
        expect(titles).toEqual(sortedTitles);
    });
});
