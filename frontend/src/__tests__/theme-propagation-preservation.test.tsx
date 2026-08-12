/**
 * Preservation Property Tests: Theme Propagation
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3**
 * 
 * **IMPORTANT**: These tests MUST PASS on unfixed code - they confirm baseline behavior to preserve
 * 
 * Purpose: Verify components already using CSS variables remain unchanged after the fix
 * 
 * Testing Strategy (Observation-First Methodology):
 * 1. Identify components already using CSS variable-based classes correctly
 * 2. Observe their behavior on UNFIXED code
 * 3. Capture baseline behavior patterns
 * 4. Document expected preservation requirements
 * 
 * These tests will:
 * - PASS on unfixed code (confirming baseline behavior)
 * - PASS after the fix (confirming no regressions)
 * 
 * Components identified as already correct:
 * - Header component (uses bg-bg-card, text-text-primary, border-border, etc.)
 * - StatCard component (uses .card class and CSS variable classes)
 * - AccountCard component (uses .card class and CSS variable classes)
 * - Components using .glass class from globals.css
 * - ManageAccountTypesModal (uses bg-bg-card, border-border)
 */

import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StatCard } from '@/components/ui/StatCard';
import { AccountCard } from '@/components/ui/AccountCard';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PrivacyProvider } from '@/components/providers/PrivacyProvider';
import React from 'react';
import { TrendingUp } from 'lucide-react';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

/**
 * CSS variable-based patterns that should be preserved
 * From design.md Section 6.2
 */
const CSS_VARIABLE_PATTERNS = {
  bgVariable: /bg-(bg-primary|bg-secondary|bg-card|bg-hover)/,
  textVariable: /text-(text-primary|text-secondary|text-muted)/,
  borderVariable: /border-(border|border-subtle)/,
  accentVariable: /(bg-accent|text-accent|border-accent)/,
  utilityClasses: /\b(card|glass|gradient-text)\b/,
};

/**
 * Hard-coded color patterns that should NOT exist in preserved components
 */
const HARD_CODED_PATTERNS = {
  bgHardCoded: /bg-\[#[0-9a-fA-F]{3,6}\]/,
  textHardCoded: /text-\[#[0-9a-fA-F]{3,6}\]/,
  borderHardCoded: /border-\[#[0-9a-fA-F]{3,6}\]/,
};

/**
 * Test wrapper component that provides necessary context
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PrivacyProvider>
        {children}
      </PrivacyProvider>
    </ThemeProvider>
  );
}

/**
 * Helper to check if element uses CSS variable classes
 */
function usesCSSVariableClasses(element: HTMLElement): boolean {
  const className = element.className || '';
  return (
    CSS_VARIABLE_PATTERNS.bgVariable.test(className) ||
    CSS_VARIABLE_PATTERNS.textVariable.test(className) ||
    CSS_VARIABLE_PATTERNS.borderVariable.test(className) ||
    CSS_VARIABLE_PATTERNS.accentVariable.test(className) ||
    CSS_VARIABLE_PATTERNS.utilityClasses.test(className)
  );
}

/**
 * Helper to check if element has NO hard-coded colors
 */
function hasNoHardCodedColors(element: HTMLElement): boolean {
  const className = element.className || '';
  return !(
    HARD_CODED_PATTERNS.bgHardCoded.test(className) ||
    HARD_CODED_PATTERNS.textHardCoded.test(className) ||
    HARD_CODED_PATTERNS.borderHardCoded.test(className)
  );
}

/**
 * Helper to extract all CSS variable classes from className
 */
function extractCSSVariableClasses(className: string): string[] {
  const allClasses = className.split(/\s+/);
  return allClasses.filter(cls => {
    return (
      CSS_VARIABLE_PATTERNS.bgVariable.test(cls) ||
      CSS_VARIABLE_PATTERNS.textVariable.test(cls) ||
      CSS_VARIABLE_PATTERNS.borderVariable.test(cls) ||
      CSS_VARIABLE_PATTERNS.accentVariable.test(cls) ||
      CSS_VARIABLE_PATTERNS.utilityClasses.test(cls)
    );
  });
}

describe('Theme Propagation - Preservation Property Tests', () => {
  describe('Property 2: StatCard Component Preservation', () => {
    test('StatCard uses .card class and CSS variable classes', () => {
      /**
       * **EXPECTED OUTCOME**: This test PASSES on unfixed code
       * 
       * Observation: StatCard component uses:
       * - .card class (from globals.css - provides bg-bg-card and border-border)
       * - bg-bg-card/90 (background with opacity)
       * - border-border/80 (border with opacity)
       * - hover:border-accent/40 (hover border)
       * - text-text-secondary (title text)
       * - text-text-primary (value text)
       * - bg-bg-secondary (minimize button background)
       * - bg-bg-hover (button hover state)
       * - bg-accent/10 (icon background)
       * - text-accent (icon color)
       * 
       * This is the BASELINE behavior to preserve.
       */

      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Total Balance"
            value="$10,000"
            trend={5}
            trendType="up"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      const cardElement = container.querySelector('.card') as HTMLElement;
      expect(cardElement).toBeTruthy();

      const className = cardElement.className;
      console.log('StatCard className:', className);

      // Extract CSS variable classes
      const cssVariableClasses = extractCSSVariableClasses(className);
      console.log('CSS variable classes in StatCard:', cssVariableClasses);

      /**
       * ASSERTION 1: StatCard should use .card class
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/\bcard\b/);

      /**
       * ASSERTION 2: StatCard should use CSS variable classes
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/bg-bg-card/);
      expect(className).toMatch(/border-border/);
      expect(className).toMatch(/hover:border-accent/);

      /**
       * ASSERTION 3: StatCard should have NO hard-coded colors
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(hasNoHardCodedColors(cardElement)).toBe(true);
    });

    test('StatCard title uses text-text-secondary', () => {
      /**
       * Observation: StatCard title (h3) uses text-text-secondary class
       */

      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Total Balance"
            value="$10,000"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      const titleElement = container.querySelector('h3') as HTMLElement;
      expect(titleElement).toBeTruthy();

      const className = titleElement.className;
      console.log('StatCard title className:', className);

      /**
       * ASSERTION: Title should use text-text-secondary
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/text-text-secondary/);
      expect(hasNoHardCodedColors(titleElement)).toBe(true);
    });

    test('StatCard value uses text-text-primary', () => {
      /**
       * Observation: StatCard value uses text-text-primary class
       */

      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Total Balance"
            value="$10,000"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      const valueElement = container.querySelector('.text-2xl') as HTMLElement;
      expect(valueElement).toBeTruthy();

      const className = valueElement.className;
      console.log('StatCard value className:', className);

      /**
       * ASSERTION: Value should use text-text-primary
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/text-text-primary/);
      expect(hasNoHardCodedColors(valueElement)).toBe(true);
    });

    test('StatCard minimize button uses CSS variable classes', () => {
      /**
       * Observation: Minimize button uses:
       * - bg-bg-secondary (background)
       * - hover:bg-bg-hover (hover state)
       * - border-border/80 (border)
       * - text-accent (icon color)
       */

      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Total Balance"
            value="$10,000"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      const minimizeButton = container.querySelector('button') as HTMLElement;
      expect(minimizeButton).toBeTruthy();

      const className = minimizeButton.className;
      console.log('Minimize button className:', className);

      /**
       * ASSERTION: Button should use CSS variable classes
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/bg-bg-secondary/);
      expect(className).toMatch(/hover:bg-bg-hover/);
      expect(className).toMatch(/border-border/);
      expect(hasNoHardCodedColors(minimizeButton)).toBe(true);
    });

    test('StatCard icon container uses accent colors', () => {
      /**
       * Observation: Icon container uses:
       * - bg-accent/10 (background with opacity)
       * - text-accent (text/icon color)
       */

      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Total Balance"
            value="$10,000"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      // Find icon container (div with h-9 w-9)
      const iconContainer = container.querySelector('.h-9.w-9') as HTMLElement;
      expect(iconContainer).toBeTruthy();

      const className = iconContainer.className;
      console.log('Icon container className:', className);

      /**
       * ASSERTION: Icon container should use accent classes
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/bg-accent/);
      expect(className).toMatch(/text-accent/);
      expect(hasNoHardCodedColors(iconContainer)).toBe(true);
    });
  });

  describe('Property 2: AccountCard Component Preservation', () => {
    test('AccountCard uses .card class and CSS variable classes', () => {
      /**
       * **EXPECTED OUTCOME**: This test PASSES on unfixed code
       * 
       * Observation: AccountCard component uses:
       * - .card class (from globals.css)
       * - bg-bg-card (background)
       * - border-border (border)
       * - hover:border-accent/50 (hover border)
       * - text-text-primary (account name)
       * - text-text-secondary (account type)
       * - text-text-muted (currency label)
       * 
       * This is the BASELINE behavior to preserve.
       */

      const mockAccount = {
        id: 1,
        name: 'Test Account',
        balance: 1000,
        currency: 'USD',
        type: 'Cash',
        color: '#6c63ff',
      };

      const { container } = render(
        <TestWrapper>
          <AccountCard account={mockAccount} />
        </TestWrapper>
      );

      const cardElement = container.querySelector('.card') as HTMLElement;
      expect(cardElement).toBeTruthy();

      const className = cardElement.className;
      console.log('AccountCard className:', className);

      /**
       * ASSERTION 1: AccountCard should use .card class
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/\bcard\b/);

      /**
       * ASSERTION 2: AccountCard should use CSS variable classes
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(className).toMatch(/bg-bg-card/);
      expect(className).toMatch(/border-border/);
      expect(className).toMatch(/hover:border-accent/);

      /**
       * ASSERTION 3: AccountCard should have NO hard-coded colors
       * (except for the dynamic color prop which is intentional)
       * ON UNFIXED CODE: PASSES
       * AFTER FIX: PASSES (preserved)
       */
      expect(hasNoHardCodedColors(cardElement)).toBe(true);
    });
  });

  describe('Property 2: Complete Preservation Audit', () => {
    test('All preserved components maintain CSS variable usage', () => {
      /**
       * Property 2: Preservation Test
       * 
       * This test verifies that components already using CSS variables
       * correctly do NOT have any hard-coded colors.
       * 
       * ON UNFIXED CODE: PASSES - These components are already correct
       * AFTER FIX: PASSES - These components remain correct (no regressions)
       */

      // Test StatCard
      const { container: statCardContainer } = render(
        <TestWrapper>
          <StatCard
            title="Test"
            value="$100"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      // Test AccountCard
      const { container: accountCardContainer } = render(
        <TestWrapper>
          <AccountCard
            account={{
              id: 1,
              name: 'Test',
              balance: 1000,
              currency: 'USD',
              type: 'Cash',
              color: '#6c63ff',
            }}
          />
        </TestWrapper>
      );

      // Get all elements from all preserved components
      const allElements = [
        ...Array.from(statCardContainer.querySelectorAll('*')),
        ...Array.from(accountCardContainer.querySelectorAll('*')),
      ];

      const hardCodedColorInstances: { component: string; element: string; className: string }[] = [];

      allElements.forEach((element) => {
        const className = (element as HTMLElement).className;
        if (typeof className === 'string' && className.length > 0) {
          if (!hasNoHardCodedColors(element as HTMLElement)) {
            // Determine which component this element belongs to
            let component = 'unknown';
            if (statCardContainer.contains(element)) component = 'StatCard';
            else if (accountCardContainer.contains(element)) component = 'AccountCard';

            hardCodedColorInstances.push({
              component,
              element: element.tagName.toLowerCase(),
              className,
            });
          }
        }
      });

      console.log('\n=== PRESERVATION AUDIT ===');
      console.log('Components tested: StatCard, AccountCard');
      console.log('Total elements with hard-coded colors:', hardCodedColorInstances.length);
      if (hardCodedColorInstances.length > 0) {
        console.log('Details:', JSON.stringify(hardCodedColorInstances, null, 2));
      } else {
        console.log('✅ All preserved components use CSS variables correctly');
      }
      console.log('==========================\n');

      /**
       * CRITICAL ASSERTION: ZERO hard-coded colors in preserved components
       * 
       * ON UNFIXED CODE: PASSES - These components are already correct
       * AFTER FIX: PASSES - These components remain correct (no regressions)
       */
      expect(hardCodedColorInstances).toHaveLength(0);
    });

    test('Preserved components use expected CSS variable patterns', () => {
      /**
       * Verify that preserved components use the expected CSS variable classes
       * as defined in the design document.
       */

      // Test StatCard
      const { container: statCardContainer } = render(
        <TestWrapper>
          <StatCard
            title="Test"
            value="$100"
            icon={<TrendingUp size={18} />}
          />
        </TestWrapper>
      );

      const statCardElement = statCardContainer.querySelector('.card') as HTMLElement;
      const statCardClassName = statCardElement.className;

      // StatCard should use these CSS variable classes
      expect(statCardClassName).toMatch(/\bcard\b/);
      expect(statCardClassName).toMatch(/bg-bg-card/);
      expect(statCardClassName).toMatch(/border-border/);
      expect(statCardClassName).toMatch(/hover:border-accent/);

      // Test AccountCard
      const { container: accountCardContainer } = render(
        <TestWrapper>
          <AccountCard
            account={{
              id: 1,
              name: 'Test',
              balance: 1000,
              currency: 'USD',
              type: 'Cash',
              color: '#6c63ff',
            }}
          />
        </TestWrapper>
      );

      const accountCardElement = accountCardContainer.querySelector('.card') as HTMLElement;
      const accountCardClassName = accountCardElement.className;

      // AccountCard should use these CSS variable classes
      expect(accountCardClassName).toMatch(/\bcard\b/);
      expect(accountCardClassName).toMatch(/bg-bg-card/);
      expect(accountCardClassName).toMatch(/border-border/);
      expect(accountCardClassName).toMatch(/hover:border-accent/);

      console.log('\n=== CSS VARIABLE PATTERN VERIFICATION ===');
      console.log('✅ StatCard uses expected CSS variable patterns');
      console.log('✅ AccountCard uses expected CSS variable patterns');
      console.log('==========================================\n');
    });
  });
});
