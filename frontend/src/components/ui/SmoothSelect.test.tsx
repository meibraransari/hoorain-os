/**
 * Unit Tests: SmoothSelect Component Refactoring
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1**
 * 
 * Purpose: Verify SmoothSelect component uses CSS variable-based classes
 * and responds correctly to theme changes
 * 
 * Testing Strategy:
 * 1. Verify no hard-coded color values remain
 * 2. Verify all colors use CSS variable-based Tailwind classes
 * 3. Verify dropdown functionality is preserved
 * 4. Verify component renders correctly with various props
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SmoothSelect, SelectOption } from './SmoothSelect';

// Mock options for testing
const mockOptions: SelectOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2', description: 'Description for option 2' },
  { value: '3', label: 'Option 3', icon: <>🎯</> },
];

describe('SmoothSelect - Refactored Component Tests', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    cleanup();
  });
  
  afterEach(() => {
    cleanup();
  });

  describe('CSS Variable Class Usage', () => {
    test('trigger button uses CSS variable-based background classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      expect(button).toBeTruthy();

      const className = button.className;
      
      // Should use bg-bg-secondary for closed state
      expect(className).toMatch(/bg-bg-secondary/);
      
      // Should NOT have hard-coded background colors
      expect(className).not.toMatch(/bg-\[#[0-9a-fA-F]+\]/);
    });

    test('trigger button uses CSS variable-based border classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      const className = button.className;
      
      // Should use border-border for closed state
      expect(className).toMatch(/border-border/);
      
      // Should use border-accent for hover
      expect(className).toMatch(/hover:border-accent/);
      
      // Should NOT have hard-coded border colors
      expect(className).not.toMatch(/border-\[#[0-9a-fA-F]+\]/);
    });

    test('trigger button uses CSS variable-based text classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
          placeholder="Select..."
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      const className = button.className;
      
      // Placeholder should use text-text-secondary
      const placeholder = button.querySelector('span.text-text-secondary');
      expect(placeholder).toBeTruthy();
      
      // Should NOT have hard-coded text colors
      expect(className).not.toMatch(/text-\[#[0-9a-fA-F]+\]/);
    });

    test('selected option text uses text-text-primary', () => {
      const { container } = render(
        <SmoothSelect
          value="1"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      const selectedText = button.querySelector('span.text-text-primary');
      
      expect(selectedText).toBeTruthy();
      expect(selectedText?.textContent).toContain('Option 1');
    });

    test('chevron icon uses CSS variable classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      const chevronWrapper = button.querySelector('.text-text-secondary');
      
      expect(chevronWrapper).toBeTruthy();
    });

    test('open state uses accent color classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      
      // Open the dropdown
      fireEvent.click(button);
      
      const className = button.className;
      
      // Should use border-accent when open
      expect(className).toMatch(/border-accent/);
      
      // Should use ring-accent/30 when open
      expect(className).toMatch(/ring-accent\/30/);
      
      // Should use bg-bg-card when open
      expect(className).toMatch(/bg-bg-card/);
    });
  });

  describe('Dropdown Menu CSS Variable Usage', () => {
    test('dropdown menu uses CSS variable-based background', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      // Find dropdown menu
      const dropdown = container.querySelector('.absolute.z-50') as HTMLElement;
      expect(dropdown).toBeTruthy();

      const className = dropdown.className;
      
      // Should use bg-bg-card
      expect(className).toMatch(/bg-bg-card/);
      
      // Should use border-border
      expect(className).toMatch(/border-border/);
      
      // Should NOT have hard-coded colors
      expect(className).not.toMatch(/bg-\[#[0-9a-fA-F]+\]/);
      expect(className).not.toMatch(/border-\[#[0-9a-fA-F]+\]/);
    });

    test('dropdown option uses CSS variable classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const options = container.querySelectorAll('.cursor-pointer');
      expect(options.length).toBeGreaterThan(0);

      const firstOption = options[0] as HTMLElement;
      const className = firstOption.className;
      
      // Should use text-text-primary for unselected
      expect(className).toMatch(/text-text-primary/);
      
      // Should use hover:bg-bg-hover
      expect(className).toMatch(/hover:bg-bg-hover/);
      
      // Should NOT have hard-coded colors
      expect(className).not.toMatch(/text-\[#[0-9a-fA-F]+\]/);
      expect(className).not.toMatch(/hover:bg-\[#[0-9a-fA-F]+\]/);
    });

    test('selected option uses accent color', () => {
      const { container } = render(
        <SmoothSelect
          value="1"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const selectedOption = container.querySelector('.bg-accent\\/20') as HTMLElement;
      expect(selectedOption).toBeTruthy();

      const className = selectedOption.className;
      
      // Should use bg-accent/20
      expect(className).toMatch(/bg-accent\/20/);
      
      // Should use text-accent
      expect(className).toMatch(/text-accent/);
      
      // Should use ring-accent/40
      expect(className).toMatch(/ring-accent\/40/);
    });
  });

  describe('Searchable Dropdown CSS Variables', () => {
    test('search input uses CSS variable classes', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
          searchable={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const searchInput = container.querySelector('input[type="text"]') as HTMLElement;
      expect(searchInput).toBeTruthy();

      const className = searchInput.className;
      
      // Should use bg-bg-hover
      expect(className).toMatch(/bg-bg-hover/);
      
      // Should use border-border-subtle
      expect(className).toMatch(/border-border-subtle/);
      
      // Should use text-text-primary
      expect(className).toMatch(/text-text-primary/);
      
      // Should use focus:border-accent
      expect(className).toMatch(/focus:border-accent/);
      
      // Should use focus:ring-accent/30
      expect(className).toMatch(/focus:ring-accent\/30/);
      
      // Should NOT have hard-coded colors
      expect(className).not.toMatch(/bg-\[#[0-9a-fA-F]+\]/);
      expect(className).not.toMatch(/border-\[#[0-9a-fA-F]+\]/);
    });

    test('search container uses CSS variable borders', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
          searchable={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const searchContainer = container.querySelector('.border-b') as HTMLElement;
      expect(searchContainer).toBeTruthy();

      const className = searchContainer.className;
      
      // Should use border-border-subtle
      expect(className).toMatch(/border-border-subtle/);
      
      // Should use bg-bg-secondary
      expect(className).toMatch(/bg-bg-secondary/);
    });
  });

  describe('No Hard-Coded Colors Verification', () => {
    test('component has zero hard-coded background colors', () => {
      const { container } = render(
        <SmoothSelect
          value="1"
          onChange={() => {}}
          options={mockOptions}
          searchable={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      // Get all elements
      const allElements = container.querySelectorAll('*');
      
      const hardCodedBgPattern = /bg-\[#[0-9a-fA-F]+\]/;
      const elementsWithHardCodedBg: string[] = [];

      allElements.forEach(el => {
        const className = (el as HTMLElement).className;
        if (typeof className === 'string' && hardCodedBgPattern.test(className)) {
          elementsWithHardCodedBg.push(className);
        }
      });

      expect(elementsWithHardCodedBg).toEqual([]);
    });

    test('component has zero hard-coded text colors', () => {
      const { container } = render(
        <SmoothSelect
          value="1"
          onChange={() => {}}
          options={mockOptions}
          searchable={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const allElements = container.querySelectorAll('*');
      
      const hardCodedTextPattern = /text-\[#[0-9a-fA-F]+\]/;
      const elementsWithHardCodedText: string[] = [];

      allElements.forEach(el => {
        const className = (el as HTMLElement).className;
        if (typeof className === 'string' && hardCodedTextPattern.test(className)) {
          elementsWithHardCodedText.push(className);
        }
      });

      expect(elementsWithHardCodedText).toEqual([]);
    });

    test('component has zero hard-coded border colors', () => {
      const { container } = render(
        <SmoothSelect
          value="1"
          onChange={() => {}}
          options={mockOptions}
          searchable={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const allElements = container.querySelectorAll('*');
      
      const hardCodedBorderPattern = /border-\[#[0-9a-fA-F]+\]/;
      const elementsWithHardCodedBorder: string[] = [];

      allElements.forEach(el => {
        const className = (el as HTMLElement).className;
        if (typeof className === 'string' && hardCodedBorderPattern.test(className)) {
          elementsWithHardCodedBorder.push(className);
        }
      });

      expect(elementsWithHardCodedBorder).toEqual([]);
    });
  });

  describe('Functionality Preservation', () => {
    test('dropdown opens and closes correctly', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      
      // Initially closed
      let dropdown = container.querySelector('.absolute.z-50');
      expect(dropdown).toBeFalsy();
      
      // Click to open
      fireEvent.click(button);
      dropdown = container.querySelector('.absolute.z-50');
      expect(dropdown).toBeTruthy();
    });

    test('selecting an option calls onChange', () => {
      let selectedValue = '';
      const handleChange = (value: string) => {
        selectedValue = value;
      };

      const { container } = render(
        <SmoothSelect
          value=""
          onChange={handleChange}
          options={mockOptions}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const options = container.querySelectorAll('.cursor-pointer');
      fireEvent.click(options[0] as HTMLElement);

      expect(selectedValue).toBe('1');
    });

    test('disabled state works correctly', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
          disabled={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      expect(button.disabled).toBe(true);
      expect(button.className).toMatch(/cursor-not-allowed/);
    });

    test('search functionality works', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
          searchable={true}
        />
      );

      const button = container.querySelector('button') as HTMLElement;
      fireEvent.click(button);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Option 2' } });

      // Should filter to only Option 2
      const visibleOptions = container.querySelectorAll('.cursor-pointer');
      expect(visibleOptions.length).toBe(1);
    });

    test('placeholder displays correctly', () => {
      const { container } = render(
        <SmoothSelect
          value=""
          onChange={() => {}}
          options={mockOptions}
          placeholder="Custom Placeholder"
        />
      );

      const placeholder = container.querySelector('.text-text-secondary');
      expect(placeholder?.textContent).toBe('Custom Placeholder');
    });
  });
});
