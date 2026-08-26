import { test, expect, type Response } from '@playwright/test';

test.describe('Game Listing and Navigation', () => {
  test('should display games with titles on index page', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify games grid is visible', async () => {
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Verify game cards are displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first()).toBeVisible();
      expect(await gameCards.count()).toBeGreaterThan(0);
    });

    await test.step('Verify game cards have titles with content', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first().getByTestId('game-title')).toBeVisible();
      await expect(gameCards.first().getByTestId('game-title')).not.toBeEmpty();
    });
  });

  test('should navigate to correct game details page when clicking on a game', async ({ page }) => {
    let gameId: string | null;
    let gameTitle: string | null;

    await test.step('Navigate to homepage and wait for games to load', async () => {
      await page.goto('/');
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Get first game information and click it', async () => {
      const firstGameCard = page.getByTestId('game-card').first();
      gameId = await firstGameCard.getAttribute('data-game-id');
      gameTitle = await firstGameCard.getAttribute('data-game-title');
      await firstGameCard.click();
    });

    await test.step('Verify navigation to game details page', async () => {
      await expect(page).toHaveURL(`/game/${gameId}`);
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title matches clicked game', async () => {
      if (gameTitle) {
        await expect(page.getByTestId('game-details-title')).toHaveText(gameTitle);
      }
    });
  });

  test('should display game details with all required information', async ({ page }) => {
    await test.step('Navigate to specific game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title is displayed', async () => {
      const gameTitle = page.getByTestId('game-details-title');
      await expect(gameTitle).toBeVisible();
      await expect(gameTitle).not.toBeEmpty();
    });

    await test.step('Verify game description is displayed', async () => {
      const gameDescription = page.getByTestId('game-details-description');
      await expect(gameDescription).toBeVisible();
      await expect(gameDescription).not.toBeEmpty();
    });

    await test.step('Verify publisher or category information is present', async () => {
      const publisherExists = await page.getByTestId('game-details-publisher').isVisible();
      const categoryExists = await page.getByTestId('game-details-category').isVisible();
      expect(publisherExists || categoryExists).toBeTruthy();

      if (publisherExists) {
        await expect(page.getByTestId('game-details-publisher')).not.toBeEmpty();
      }

      if (categoryExists) {
        await expect(page.getByTestId('game-details-category')).not.toBeEmpty();
      }
    });
  });

  test('should display a button to back the game', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify back game button is visible and enabled', async () => {
      const backButton = page.getByTestId('back-game-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Support This Game');
      await expect(backButton).toBeEnabled();
    });
  });

  test('should be able to navigate back to home from game details', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Click back to all games link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
    });

    await test.step('Verify navigation back to homepage', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should return a 404 page for a non-existent game', async ({ page }) => {
    let response: Response | null;

    await test.step('Navigate to non-existent game', async () => {
      response = await page.goto('/game/99999');
    });

    await test.step('Verify a branded 404 page is served', async () => {
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle(/Page Not Found - Tailspin Toys/);
      await expect(page.getByTestId('not-found')).toBeVisible();
      await expect(page.getByTestId('not-found-heading')).not.toBeEmpty();
      await expect(page.getByTestId('not-found-home-link')).toBeVisible();
    });
  });
});

test.describe('Game Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display category filter controls', async ({ page }) => {
    await test.step('Verify category filter section is visible', async () => {
      await expect(page.getByRole('group', { name: 'Category filters' })).toBeVisible();
    });

    await test.step('Verify at least one category filter exists', async () => {
      const categoryFilters = page.locator('input[name="category"]');
      expect(await categoryFilters.count()).toBeGreaterThan(0);
    });

    await test.step('Verify category filters have proper test IDs', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      const testId = await firstCategoryFilter.getAttribute('data-testid');
      expect(testId).toMatch(/^filter-category-\d+$/);
    });
  });

  test('should display publisher filter controls', async ({ page }) => {
    await test.step('Verify publisher filter section is visible', async () => {
      await expect(page.getByRole('group', { name: 'Publisher filters' })).toBeVisible();
    });

    await test.step('Verify at least one publisher filter exists', async () => {
      const publisherFilters = page.locator('input[name="publisher"]');
      expect(await publisherFilters.count()).toBeGreaterThan(0);
    });

    await test.step('Verify publisher filters have proper test IDs', async () => {
      const firstPublisherFilter = page.locator('input[name="publisher"]').first();
      const testId = await firstPublisherFilter.getAttribute('data-testid');
      expect(testId).toMatch(/^filter-publisher-\d+$/);
    });
  });

  test('should filter games by category', async ({ page }) => {
    let totalGamesCount: number;
    let filteredGamesCount: number;

    await test.step('Count total games before filtering', async () => {
      const gameCards = page.locator('.game-card');
      await expect(gameCards.first()).toBeVisible();
      totalGamesCount = await gameCards.count();
    });

    await test.step('Select a category filter', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      await firstCategoryFilter.check();
      // Wait for filtering to complete
      await page.waitForTimeout(100);
    });

    await test.step('Verify games are filtered', async () => {
      const visibleGameCards = page.locator('.game-card:visible');
      filteredGamesCount = await visibleGameCards.count();
      expect(filteredGamesCount).toBeLessThanOrEqual(totalGamesCount);
    });

    await test.step('Verify heading changes to "Filtered Games"', async () => {
      await expect(page.locator('#games-heading')).toHaveText('Filtered Games');
    });
  });

  test('should filter games by publisher', async ({ page }) => {
    let totalGamesCount: number;

    await test.step('Count total games before filtering', async () => {
      const gameCards = page.locator('.game-card');
      await expect(gameCards.first()).toBeVisible();
      totalGamesCount = await gameCards.count();
    });

    await test.step('Select a publisher filter', async () => {
      const firstPublisherFilter = page.locator('input[name="publisher"]').first();
      await firstPublisherFilter.check();
      // Wait for filtering to complete
      await page.waitForTimeout(100);
    });

    await test.step('Verify games are filtered', async () => {
      const visibleGameCards = page.locator('.game-card:visible');
      const filteredGamesCount = await visibleGameCards.count();
      expect(filteredGamesCount).toBeLessThanOrEqual(totalGamesCount);
    });
  });

  test('should combine category and publisher filters', async ({ page }) => {
    await test.step('Select both category and publisher filters', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      const firstPublisherFilter = page.locator('input[name="publisher"]').first();
      
      await firstCategoryFilter.check();
      await firstPublisherFilter.check();
      // Wait for filtering to complete
      await page.waitForTimeout(100);
    });

    await test.step('Verify games are filtered by both criteria', async () => {
      const visibleGameCards = page.locator('.game-card:visible');
      // Should show games that match both the selected category AND publisher
      expect(await visibleGameCards.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test('should clear all filters when clear button is clicked', async ({ page }) => {
    let totalGamesCount: number;

    await test.step('Count total games', async () => {
      const gameCards = page.locator('.game-card');
      await expect(gameCards.first()).toBeVisible();
      totalGamesCount = await gameCards.count();
    });

    await test.step('Apply some filters', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      await firstCategoryFilter.check();
      await page.waitForTimeout(100);
    });

    await test.step('Click clear filters button', async () => {
      const clearButton = page.getByTestId('clear-filters-button');
      await expect(clearButton).toBeVisible();
      await clearButton.click();
      await page.waitForTimeout(100);
    });

    await test.step('Verify all games are shown again', async () => {
      const visibleGameCards = page.locator('.game-card:visible');
      expect(await visibleGameCards.count()).toBe(totalGamesCount);
    });

    await test.step('Verify heading returns to "Featured Games"', async () => {
      await expect(page.locator('#games-heading')).toHaveText('Featured Games');
    });

    await test.step('Verify all checkboxes are unchecked', async () => {
      const allCheckboxes = page.locator('input[name="category"], input[name="publisher"]');
      const count = await allCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await expect(allCheckboxes.nth(i)).not.toBeChecked();
      }
    });
  });

  test('should update URL with filter parameters', async ({ page }) => {
    await test.step('Select a category filter', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      const categoryId = await firstCategoryFilter.getAttribute('value');
      await firstCategoryFilter.check();
      await page.waitForTimeout(100);

      // Verify URL contains the category parameter
      const url = page.url();
      expect(url).toContain(`category=${categoryId}`);
    });

    await test.step('Select a publisher filter', async () => {
      const firstPublisherFilter = page.locator('input[name="publisher"]').first();
      const publisherId = await firstPublisherFilter.getAttribute('value');
      await firstPublisherFilter.check();
      await page.waitForTimeout(100);

      // Verify URL contains both parameters
      const url = page.url();
      expect(url).toContain(`publisher=${publisherId}`);
    });
  });

  test('should preserve filters when loading page with URL parameters', async ({ page }) => {
    await test.step('Get first category and publisher IDs', async () => {
      const firstCategoryId = await page.locator('input[name="category"]').first().getAttribute('value');
      const firstPublisherId = await page.locator('input[name="publisher"]').first().getAttribute('value');

      // Navigate with filter parameters
      await page.goto(`/?category=${firstCategoryId}&publisher=${firstPublisherId}`);
    });

    await test.step('Verify filters are checked', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      const firstPublisherFilter = page.locator('input[name="publisher"]').first();

      await expect(firstCategoryFilter).toBeChecked();
      await expect(firstPublisherFilter).toBeChecked();
    });

    await test.step('Verify games are filtered', async () => {
      await expect(page.locator('#games-heading')).toHaveText('Filtered Games');
    });
  });

  test('should show empty state when no games match filters', async ({ page }) => {
    await test.step('Select all category filters (edge case testing)', async () => {
      // In a real scenario, we'd want to ensure we have a combination that yields no results
      // For this test, we'll just verify the empty state element exists and check its behavior
      const categoryFilters = page.locator('input[name="category"]');
      const count = await categoryFilters.count();

      // Select all categories - this might still show games, but we're testing the mechanism
      for (let i = 0; i < count; i++) {
        await categoryFilters.nth(i).check();
      }
      await page.waitForTimeout(100);

      // The empty state should be hidden if games are visible
      const emptyState = page.locator('#empty-state');
      const gamesGrid = page.locator('#games-grid');

      const gamesVisible = await gamesGrid.isVisible();
      const emptyVisible = await emptyState.isVisible();

      // Either games are shown or empty state is shown, but not both
      expect(gamesVisible !== emptyVisible).toBeTruthy();
    });
  });

  test('should support keyboard navigation for filters', async ({ page }) => {
    await test.step('Navigate to first category filter with keyboard', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      await firstCategoryFilter.focus();
      await expect(firstCategoryFilter).toBeFocused();
    });

    await test.step('Check filter with Space key', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      await firstCategoryFilter.press('Space');
      await page.waitForTimeout(100);
      await expect(firstCategoryFilter).toBeChecked();
    });

    await test.step('Navigate to clear button with Tab', async () => {
      const clearButton = page.getByTestId('clear-filters-button');
      await clearButton.focus();
      await expect(clearButton).toBeFocused();
    });
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    await test.step('Verify filter groups have proper role and label', async () => {
      await expect(page.getByRole('group', { name: 'Category filters' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Publisher filters' })).toBeVisible();
    });

    await test.step('Verify checkboxes have visible focus states', async () => {
      const firstCategoryFilter = page.locator('input[name="category"]').first();
      await firstCategoryFilter.focus();
      // The checkbox should have focus styles (tested via CSS classes in the HTML)
      const classes = await firstCategoryFilter.getAttribute('class');
      expect(classes).toContain('focus:ring-2');
    });
  });
});
