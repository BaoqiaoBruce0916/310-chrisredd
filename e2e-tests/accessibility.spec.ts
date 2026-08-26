import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('game details page should not have accessibility violations', async ({ page }) => {
    await page.goto('/game/1');
    await page.waitForSelector('[data-testid="game-details"]', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('about page should not have accessibility violations', async ({ page }) => {
    await page.goto('/about');
    await page.waitForSelector('[data-testid="about-section"]', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe('High Contrast Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Clear localStorage before each test
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
    });

    test('high contrast toggle should be present and accessible', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('high-contrast-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-pressed');
      await expect(toggle).toHaveAttribute('aria-label', 'Toggle high contrast mode');
      await expect(toggle).toHaveAttribute('type', 'button');
    });

    test('should toggle high contrast mode on click', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('high-contrast-toggle');
      const html = page.locator('html');
      
      // Initially should not be in high contrast mode
      await expect(html).not.toHaveAttribute('data-high-contrast', 'true');
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      
      // Click to enable
      await toggle.click();
      await expect(html).toHaveAttribute('data-high-contrast', 'true');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      
      // Click to disable
      await toggle.click();
      await expect(html).not.toHaveAttribute('data-high-contrast', 'true');
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    test('should persist high contrast setting across page reloads', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('high-contrast-toggle');
      const html = page.locator('html');
      
      // Enable high contrast mode
      await toggle.click();
      await expect(html).toHaveAttribute('data-high-contrast', 'true');
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Should still be in high contrast mode
      await expect(html).toHaveAttribute('data-high-contrast', 'true');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('high-contrast-toggle');
      const html = page.locator('html');
      
      // Tab to the toggle button
      let tabCount = 0;
      const MAX_TABS = 20;
      
      while (tabCount < MAX_TABS) {
        await page.keyboard.press('Tab');
        tabCount++;
        const isFocused = await toggle.evaluate(el => el === document.activeElement);
        if (isFocused) break;
      }
      
      await expect(toggle).toBeFocused();
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await expect(html).toHaveAttribute('data-high-contrast', 'true');
      
      // Deactivate with Space
      await page.keyboard.press('Space');
      await expect(html).not.toHaveAttribute('data-high-contrast', 'true');
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('high-contrast-toggle');
      
      // Click to enable and check for live region announcement
      await toggle.click();
      
      // Wait for the announcement element to appear
      const announcement = page.locator('[role="status"][aria-live="polite"]');
      await expect(announcement).toBeAttached({ timeout: 1000 });
      await expect(announcement).toContainText('High contrast mode enabled');
    });

    test('should not have accessibility violations in high contrast mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable high contrast mode
      const toggle = page.getByTestId('high-contrast-toggle');
      await toggle.click();
      
      // Wait for the mode to be applied
      await page.waitForSelector('html[data-high-contrast="true"]');
      
      // Run accessibility scan in high contrast mode
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Light Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Clear localStorage before each test
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
    });

    test('light mode toggle should be present and accessible', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('light-mode-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-pressed');
      await expect(toggle).toHaveAttribute('aria-label', 'Toggle light mode');
      await expect(toggle).toHaveAttribute('type', 'button');
    });

    test('should toggle light mode on click', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('light-mode-toggle');
      const html = page.locator('html');
      
      // Initially should be in dark mode
      await expect(html).not.toHaveAttribute('data-light-mode', 'true');
      await expect(html).toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      
      // Click to enable light mode
      await toggle.click();
      await expect(html).toHaveAttribute('data-light-mode', 'true');
      await expect(html).not.toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      
      // Click to disable light mode (back to dark)
      await toggle.click();
      await expect(html).not.toHaveAttribute('data-light-mode', 'true');
      await expect(html).toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    test('should persist light mode setting across page reloads', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('light-mode-toggle');
      const html = page.locator('html');
      
      // Enable light mode
      await toggle.click();
      await expect(html).toHaveAttribute('data-light-mode', 'true');
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Should still be in light mode
      await expect(html).toHaveAttribute('data-light-mode', 'true');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('light-mode-toggle');
      const html = page.locator('html');
      
      // Tab to the toggle button
      let tabCount = 0;
      const MAX_TABS = 20;
      
      while (tabCount < MAX_TABS) {
        await page.keyboard.press('Tab');
        tabCount++;
        const isFocused = await toggle.evaluate(el => el === document.activeElement);
        if (isFocused) break;
      }
      
      await expect(toggle).toBeFocused();
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await expect(html).toHaveAttribute('data-light-mode', 'true');
      
      // Deactivate with Space
      await page.keyboard.press('Space');
      await expect(html).not.toHaveAttribute('data-light-mode', 'true');
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      await page.goto('/');
      
      const toggle = page.getByTestId('light-mode-toggle');
      
      // Click to enable and check for live region announcement
      await toggle.click();
      
      // Wait for the announcement element to appear
      const announcement = page.locator('[role="status"][aria-live="polite"]');
      await expect(announcement).toBeAttached({ timeout: 1000 });
      await expect(announcement).toContainText('Light mode enabled');
    });

    test('should not have accessibility violations in light mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable light mode
      const toggle = page.getByTestId('light-mode-toggle');
      await toggle.click();
      
      // Wait for the mode to be applied
      await page.waitForSelector('html[data-light-mode="true"]');
      
      // Run accessibility scan in light mode
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should work independently with high contrast mode', async ({ page }) => {
      await page.goto('/');
      
      const lightToggle = page.getByTestId('light-mode-toggle');
      const hcToggle = page.getByTestId('high-contrast-toggle');
      const html = page.locator('html');
      
      // Enable light mode
      await lightToggle.click();
      await expect(html).toHaveAttribute('data-light-mode', 'true');
      await expect(html).not.toHaveAttribute('data-high-contrast');
      
      // Enable high contrast while in light mode
      await hcToggle.click();
      await expect(html).toHaveAttribute('data-light-mode', 'true');
      await expect(html).toHaveAttribute('data-high-contrast', 'true');
      
      // Disable light mode while keeping high contrast
      await lightToggle.click();
      await expect(html).not.toHaveAttribute('data-light-mode');
      await expect(html).toHaveAttribute('data-high-contrast', 'true');
      
      // Disable high contrast
      await hcToggle.click();
      await expect(html).not.toHaveAttribute('data-light-mode');
      await expect(html).not.toHaveAttribute('data-high-contrast');
    });
  });

  test('keyboard navigation - should be able to navigate header menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });

    const menuButton = page.getByRole('button', { name: /toggle menu/i });
    const menu = page.locator('#menu');

    await test.step('Tab until the menu button is focused', async () => {
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        if (await menuButton.evaluate(el => el === document.activeElement)) break;
      }
      await expect(menuButton).toBeFocused();
    });

    await test.step('Open menu with Enter and verify it is visible', async () => {
      await page.keyboard.press('Enter');
      await expect(menu).not.toHaveClass(/hidden/);
    });

    await test.step('Verify menu items are reachable', async () => {
      const homeLink = menu.getByRole('link', { name: /home/i });
      // Focus may already be on the first menu item after opening
      if (!await homeLink.evaluate(el => el === document.activeElement)) {
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          if (await homeLink.evaluate(el => el === document.activeElement)) break;
        }
      }
      await expect(homeLink).toBeFocused();

      const aboutLink = menu.getByRole('link', { name: /about/i });
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        if (await aboutLink.evaluate(el => el === document.activeElement)) break;
      }
      await expect(aboutLink).toBeFocused();
    });
  });

  test('keyboard navigation - should be able to navigate to game cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });

    await test.step('Tab through page until a game card receives focus', async () => {
      const MAX_TABS = 50;
      let tabCount = 0;

      await expect.poll(async () => {
        if (tabCount < MAX_TABS) {
          await page.keyboard.press('Tab');
          tabCount++;
        }
        return page.locator('[data-testid="game-card"]:focus').count();
      }, { timeout: 15000, message: 'Expected a game card to receive focus via Tab' }).toBeGreaterThan(0);
    });
  });

  test('keyboard navigation - should be able to activate game card with Enter', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });

    let gameId: string | null = null;

    await test.step('Tab to a game card using real keyboard navigation', async () => {
      let tabCount = 0;
      let gameCardFocused = false;

      while (tabCount < 20 && !gameCardFocused) {
        await page.keyboard.press('Tab');
        tabCount++;

        const focusedElement = page.locator(':focus');
        const testId = await focusedElement.getAttribute('data-testid').catch(() => null);

        if (testId === 'game-card') {
          gameId = await focusedElement.getAttribute('data-game-id');
          gameCardFocused = true;
        }
      }

      expect(gameCardFocused).toBeTruthy();
      expect(gameId).not.toBeNull();
    });

    await test.step('Press Enter and verify navigation to game page', async () => {
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(`/game/${gameId}`);
    });
  });

  test('focus indicators - should have visible focus indicators on interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
    
    // Check menu button has focus indicator
    const menuButton = page.locator('#menu-toggle');
    await menuButton.focus();
    
    // Get computed styles to check for outline or box-shadow
    const hasVisibleFocus = await menuButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      const boxShadow = styles.boxShadow;
      
      // Check if there's a visible outline or box-shadow (focus ring)
      return (outline !== 'none' && outlineWidth !== '0px') || boxShadow !== 'none';
    });
    
    expect(hasVisibleFocus).toBeTruthy();
  });

  test('ARIA labels - header menu should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check menu button has aria-label or aria-labelledby
    const menuButton = page.locator('#menu-toggle');
    const hasAriaLabel = await menuButton.evaluate((el) => {
      return el.hasAttribute('aria-label') || 
             el.hasAttribute('aria-labelledby') ||
             el.hasAttribute('aria-describedby');
    });
    
    // SVG should have proper role or title
    const menuIcon = menuButton.locator('svg');
    const svgAccessible = await menuIcon.evaluate((el) => {
      return el.hasAttribute('role') || 
             el.hasAttribute('aria-label') ||
             el.querySelector('title') !== null;
    });
    
    expect(hasAriaLabel || svgAccessible).toBeTruthy();
  });

  test('color contrast - should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
    
    // Run axe with specific color contrast checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('semantic HTML - main landmarks should be present', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
    
    // Check for header landmark (use first() to avoid strict mode violation from dev tools)
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('decorative SVGs should have aria-hidden attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="games-grid"]', { timeout: 10000 });
    
    // Check menu button SVG has aria-hidden
    const menuButtonSvg = page.locator('#menu-toggle svg');
    await expect(menuButtonSvg).toHaveAttribute('aria-hidden', 'true');
    
    // Check game card arrow SVGs have aria-hidden (scope to first card to avoid strict mode violation)
    const firstGameCard = page.locator('[data-testid="game-card"]').first();
    const gameCardSvgs = firstGameCard.locator('svg');
    const count = await gameCardSvgs.count();
    
    // Verify at least one SVG exists and all have aria-hidden
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(gameCardSvgs.nth(i)).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
