import { eq, asc, inArray, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/** All games ordered by title. */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

/**
 * Filters and options for querying games.
 */
export interface GameFilterOptions {
    /** Array of category IDs to filter by (OR condition). */
    categoryIds?: number[];
    /** Array of publisher IDs to filter by (OR condition). */
    publisherIds?: number[];
}

/**
 * Retrieves games filtered by category and/or publisher, ordered by title.
 * If both filters are provided, they are combined with AND (games must match
 * at least one category AND at least one publisher).
 * If no filters are provided, returns all games.
 *
 * @param db - The database instance to query.
 * @param options - Optional filtering criteria.
 * @returns The filtered games in ascending title order.
 */
export async function getFilteredGames(
    db: Database,
    options: GameFilterOptions = {}
): Promise<Game[]> {
    const { categoryIds, publisherIds } = options;

    const conditions = [];

    if (categoryIds && categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, categoryIds));
    }

    if (publisherIds && publisherIds.length > 0) {
        conditions.push(inArray(games.publisherId, publisherIds));
    }

    let query = baseGamesQuery(db);

    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(asc(games.title));
    return rows.map(mapGame);
}
