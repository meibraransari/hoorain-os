/**
 * Bug Condition Exploration Test: Theme Propagation
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 3.1, 3.2**
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Purpose: Surface counterexamples that demonstrate hard-coded colors don't respond to theme changes
 * 
 * Expected Behavior (from design.md):
 * - Property 1: Complete Theme Application - All colors update from T1 to T2 within same render cycle
 * - Property 2: Consistent Appearance - All components use the same theme's color palette
 * - Property 3: Immediate Update - Updates happen within single render cycle
 * 
 * This test encodes the EXPECTED behavior. It will:
 * - FAIL on unfixed code (proving the bug exists)
 * - PASS after the fix is implemented (validating the fix works)
 * 
 * Testing Strategy:
 * Instead of checking computed styles (which don't work well in jsdom),
 * we check for the presence of hard-coded Tailwind classes vs CSS variable classes.
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PrivacyProvider } from '@/components/providers/PrivacyProvider';
import React from 'react';

// Mock transaction data for testing
const mockTransaction = {
  id: 1,
  title: 'Test Transaction',
  amount: 100.50,
  type: 'expense',
  date: new Date('2026-08-12'),
  category: { name: 'Food' },
  account: { name: 'Cash' },
  notes: 'Test notes',
  income: 0,
  isTransfer: false,
  excludeFromBalance: false,
};

/**
 * Hard-coded color patterns that should NOT exist (Bug Condition)
 * From bugfix.md Section 2.1
 */
const HARD_CODED_PATTERNS = {
  bgHardCoded: /bg-\[#[0-9a-fA-F]{3,6}\]/,
  textHardCoded: /text-\[#[0-9a-fA-F]{3,6}\]/,
  borderHardCoded: /border-\[#[0-9a-fA-F]{3,6}\]/,
};

/**
 * CSS variable-based patterns that SHOULD exist (Expected Behavior)
 * From design.md Section 4.2
 */
const CSS_VARIABLE_PATTERNS = {
  bgVariable: /bg-(bg-primary|bg-secondary|bg-card|bg-hover)/,
  textVariable: /text-(text-primary|text-secondary|text-muted)/,
  borderVariable: /border-(border|border-subtle)/,
  accentVariable: /(bg-accent|text-accent|border-accent)/,
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
 * Helper to check if element has hard-coded colors
 */
function hasHardCodedColors(element: HTMLElement): boolean {
  const className = element.className || '';
  return (
    HARD_CODED_PATTERNS.bgHardCoded.test(className) ||
    HARD_CODED_PATTERNS.textHardCoded.test(className) ||
    HARD_CODED_PATTERNS.borderHardCoded.test(className)
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
    CSS_VARIABLE_PATTERNS.accentVariable.test(className)
  );
}

/**
 * Helper to extract all hard-coded color values from className
 */
function extractHardCodedColors(className: string): string[] {
  const matches = className.match(/(?:bg|text|border)-\[#[0-9a-fA-F]{3,6}\]/g) || [];
  return matches;
}

describe('Theme Propagation - Bug Condition Exploration', () => {
  test('Property 1: TransactionItem container has hard-coded background colors', () => {
    /**
     * **EXPECTED OUTCOME**: This test FAILS on unfixed code
     * 
     * Counterexample expected:
     * - TransactionItem uses bg-bg-card (hard-coded dark theme color)
     * - Should use bg-bg-card (CSS variable that responds to theme changes)
     * 
     * Bug Condition: C(component) = true when component uses bg-[#HEX]
     * Expected Behavior: Component should use bg-bg-card
     */
    
    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    const transactionElement = container.querySelector('.group') as HTMLElement;
    expect(transactionElement).toBeTruthy();

    const className = transactionElement.className;
    console.log('TransactionItem container className:', className);

    // Extract hard-coded colors
    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded colors found:', hardCodedColors);

    /**
     * ASSERTION: Container should NOT have hard-coded bg colors
     * ON UNFIXED CODE: FAILS - contains bg-bg-card
     * AFTER FIX: PASSES - uses bg-bg-card instead
     */
    expect(hardCodedColors).toHaveLength(0);
    
    // Should use CSS variable classes instead
    expect(className).toMatch(/bg-bg-card/);
    expect(className).toMatch(/border-border/);
    expect(className).toMatch(/hover:bg-bg-hover/);
  });

  test('Property 1: TransactionItem title has hard-coded text colors', () => {
    /**
     * Counterexample expected:
     * - Title uses text-text-primary (hard-coded white)
     * - Should use text-text-primary (CSS variable)
     * - Hover state uses text-accent-light (hard-coded accent)
     * - Should use text-accent-light
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    const titleElement = container.querySelector('h4') as HTMLElement;
    expect(titleElement).toBeTruthy();

    const className = titleElement.className;
    console.log('Title className:', className);

    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded text colors in title:', hardCodedColors);

    /**
     * ASSERTION: Title should NOT have hard-coded text colors
     * ON UNFIXED CODE: FAILS - contains text-text-primary and text-accent-light
     * AFTER FIX: PASSES - uses text-text-primary and text-accent-light
     */
    expect(hardCodedColors).toHaveLength(0);
    expect(className).toMatch(/text-text-primary/);
    expect(className).toMatch(/group-hover:text-accent-light/);
  });

  test('Property 1: Category pill has hard-coded colors', () => {
    /**
     * Counterexample expected:
     * - Category pill uses bg-bg-hover (hard-coded dark background)
     * - Text uses text-text-secondary (hard-coded text color)
     * - Border uses border-border (hard-coded border color)
     * 
     * Should use:
     * - bg-bg-secondary
     * - text-text-secondary
     * - border-border-subtle
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    // Find category pill (contains "🏷️")
    const categoryPill = Array.from(container.querySelectorAll('span'))
      .find(el => el.textContent?.includes('🏷️')) as HTMLElement;
    expect(categoryPill).toBeTruthy();

    const className = categoryPill.className;
    console.log('Category pill className:', className);

    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded colors in category pill:', hardCodedColors);

    /**
     * ASSERTION: Category pill should NOT have hard-coded colors
     * ON UNFIXED CODE: FAILS - contains bg-bg-hover, text-text-secondary, border-border
     * AFTER FIX: PASSES - uses bg-bg-secondary, text-text-secondary, border-border-subtle
     */
    expect(hardCodedColors).toHaveLength(0);
    expect(className).toMatch(/bg-bg-secondary/);
    expect(className).toMatch(/text-text-secondary/);
    expect(className).toMatch(/border-border-subtle/);
  });

  test('Property 1: Account pill has hard-coded colors', () => {
    /**
     * Counterexample expected:
     * - Account pill also uses bg-bg-hover, text-text-secondary, border-border
     * - Same hard-coded values as category pill
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    // Find account pill (contains "🏦")
    const accountPill = Array.from(container.querySelectorAll('span'))
      .find(el => el.textContent?.includes('🏦')) as HTMLElement;
    expect(accountPill).toBeTruthy();

    const className = accountPill.className;
    console.log('Account pill className:', className);

    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded colors in account pill:', hardCodedColors);

    /**
     * ASSERTION: Account pill should NOT have hard-coded colors
     * ON UNFIXED CODE: FAILS - contains hard-coded colors
     * AFTER FIX: PASSES - uses CSS variable classes
     */
    expect(hardCodedColors).toHaveLength(0);
    expect(className).toMatch(/bg-bg-secondary/);
    expect(className).toMatch(/text-text-secondary/);
    expect(className).toMatch(/border-border-subtle/);
  });

  test('Property 1: Notes block has hard-coded colors', () => {
    /**
     * Counterexample expected:
     * - Notes block uses bg-bg-primary (hard-coded background)
     * - Text uses text-text-secondary (hard-coded text color)
     * - Border uses border-border (hard-coded border)
     * - Icon uses text-accent-light (hard-coded accent)
     * 
     * Should use:
     * - bg-bg-secondary
     * - text-text-primary
     * - border-border
     * - text-accent-light (for icon)
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    // Find notes block (has FileText icon, class mt-2)
    const notesBlock = container.querySelector('.mt-2') as HTMLElement;
    expect(notesBlock).toBeTruthy();

    const className = notesBlock.className;
    console.log('Notes block className:', className);

    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded colors in notes block:', hardCodedColors);

    /**
     * ASSERTION: Notes block should NOT have hard-coded colors
     * ON UNFIXED CODE: FAILS - contains bg-bg-primary, text-text-secondary, border-border
     * AFTER FIX: PASSES - uses bg-bg-secondary, text-text-primary, border-border
     */
    expect(hardCodedColors).toHaveLength(0);
    expect(className).toMatch(/bg-bg-secondary/);
    expect(className).toMatch(/text-text-primary/);
    expect(className).toMatch(/border-border/);
  });

  test('Property 1: Amount text has hard-coded colors', () => {
    /**
     * Counterexample expected:
     * - Amount uses text-text-primary for expenses
     * - Should use text-text-primary
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    // Find amount element (has font-extrabold class)
    const amountElement = container.querySelector('.font-extrabold') as HTMLElement;
    expect(amountElement).toBeTruthy();

    const className = amountElement.className;
    console.log('Amount className:', className);

    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded colors in amount:', hardCodedColors);

    /**
     * ASSERTION: Amount should NOT have hard-coded text color
     * ON UNFIXED CODE: FAILS - contains text-text-primary
     * AFTER FIX: PASSES - uses text-text-primary
     */
    expect(hardCodedColors).toHaveLength(0);
    expect(className).toMatch(/text-text-primary/);
  });

  test('Property 1: Time text has hard-coded colors', () => {
    /**
     * Counterexample expected:
     * - Time uses text-text-muted (hard-coded secondary text)
     * - Should use text-text-secondary
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    // Find time element (has text-[12px] and mt-0.5)
    const timeElements = Array.from(container.querySelectorAll('span'))
      .filter(el => el.className?.includes('text-[12px]'));
    
    // Time element should exist
    expect(timeElements.length).toBeGreaterThan(0);
    
    const timeElement = timeElements[0] as HTMLElement;
    const className = timeElement.className;
    console.log('Time className:', className);

    const hardCodedColors = extractHardCodedColors(className);
    console.log('Hard-coded colors in time:', hardCodedColors);

    /**
     * ASSERTION: Time should NOT have hard-coded text color
     * ON UNFIXED CODE: FAILS - contains text-text-muted
     * AFTER FIX: PASSES - uses text-text-secondary
     */
    expect(hardCodedColors).toHaveLength(0);
    expect(className).toMatch(/text-text-secondary/);
  });

  test('Complete Bug Condition Test: Count all hard-coded colors in TransactionItem', () => {
    /**
     * Property 1: Complete Theme Application
     * 
     * This test counts ALL hard-coded colors in the component.
     * From design.md Section 5.1: TransactionItem has 25+ hard-coded colors
     * 
     * ON UNFIXED CODE: FAILS - finds 25+ hard-coded color instances
     * AFTER FIX: PASSES - finds 0 hard-coded color instances
     */

    const { container } = render(
      <TestWrapper>
        <TransactionItem transaction={mockTransaction} />
      </TestWrapper>
    );

    // Get all elements in the component
    const allElements = container.querySelectorAll('*');
    const hardCodedColorInstances: { element: string; colors: string[] }[] = [];

    allElements.forEach((element) => {
      const className = (element as HTMLElement).className;
      if (typeof className === 'string') {
        const hardCodedColors = extractHardCodedColors(className);
        
        if (hardCodedColors.length > 0) {
          hardCodedColorInstances.push({
            element: element.tagName.toLowerCase(),
            colors: hardCodedColors,
          });
        }
      }
    });

    console.log('\n=== HARD-CODED COLOR AUDIT ===');
    console.log('Total elements with hard-coded colors:', hardCodedColorInstances.length);
    console.log('Details:', JSON.stringify(hardCodedColorInstances, null, 2));
    console.log('==============================\n');

    /**
     * CRITICAL ASSERTION: ZERO hard-coded colors should exist
     * 
     * ON UNFIXED CODE: FAILS
     * Expected counterexamples:
     * - Container: bg-bg-card, border-border, hover:bg-bg-hover
     * - Title: text-text-primary, group-hover:text-accent-light
     * - Category pill: bg-bg-hover, text-text-secondary, border-border
     * - Account pill: bg-bg-hover, text-text-secondary, border-border
     * - Notes block: bg-bg-primary, text-text-secondary, border-border, text-accent-light
     * - Amount: text-text-primary
     * - Time: text-text-muted
     * 
     * Total: 18+ distinct hard-coded color instances
     * 
     * AFTER FIX: PASSES - 0 hard-coded colors
     */
    expect(hardCodedColorInstances).toHaveLength(0);
  });
});
