# Implementation Plan: Theme Propagation Fix

## Task Overview

This task list implements the bugfix for theme propagation using the bug condition methodology. The workflow follows:
1. **Explore** - Write tests BEFORE fix to understand the bug (Bug Condition)
2. **Preserve** - Write tests for non-buggy behavior (Preservation Requirements)
3. **Implement** - Apply the fix with understanding (Expected Behavior)
4. **Validate** - Verify fix works and doesn't break anything

---

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hard-coded colors prevent theme propagation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate hard-coded colors don't respond to theme changes
  - **Scoped PBT Approach**: Test specific components known to have hard-coded colors (TransactionItem, SmoothSelect, DateRangePicker)
  - Test implementation details:
    - Render component with dark theme
    - Capture background, text, and border colors
    - Switch to light theme
    - Capture colors again
    - Assert colors changed (this will FAIL on unfixed code)
    - Assert new colors match light theme palette
  - The test assertions should match the Expected Behavior Properties from design:
    - Property 1: Complete Theme Application
    - Property 2: Consistent Appearance
    - Property 3: Immediate Update
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - "TransactionItem background remains #141420 after switching to light theme"
    - "SmoothSelect border remains #2b2b40 instead of updating to light theme border"
    - "DateRangePicker text remains #c0c0e0 instead of updating to light theme text"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Components already using CSS variables remain unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for components already using CSS variables:
    - Header component (already uses theme context properly)
    - Components using `.card` class from globals.css
    - Components using `.glass` class
    - Any components already using `bg-bg-card`, `text-text-primary`, etc.
  - Write property-based tests capturing observed behavior patterns:
    - Render preserved component with dark theme
    - Capture computed styles (background, text, border colors)
    - Switch to light theme
    - Capture computed styles again
    - Assert styles changed appropriately (should PASS on unfixed code)
    - Document baseline behavior to preserve
  - Property-based testing generates test cases for stronger preservation guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Fix theme propagation across all components

  - [ ] 3.1 Update Tailwind configuration
    - Open `frontend/tailwind.config.ts`
    - Add missing color mappings: `success`, `danger`, `warning`, `info`
    - Verify all CSS variables are mapped correctly
    - Ensure color structure matches design specification (Section 4.1)
    - _Bug_Condition: Components use hard-coded colors (bg-[#HEX], text-[#HEX], border-[#HEX]) from bugfix.md Section 2_
    - _Expected_Behavior: All components use CSS variable-based Tailwind classes from design.md Section 3_
    - _Preservation: Tailwind config structure preserved, only additions made from design.md Section 6.3_
    - _Requirements: 3.3, 4.2, 7.1_

  - [ ] 3.2 Add new theme definitions to globals.css
    - Open `frontend/src/app/globals.css`
    - Add `[data-theme="sublime"]` with complete color variable set
    - Add `[data-theme="nord"]` with complete color variable set
    - Follow theme structure from design.md Section 4.3
    - Ensure all CSS variables defined: bg-*, text-*, border-*, accent-*, success, danger, warning, info
    - _Bug_Condition: Only 5 themes exist (dark, light, amoled, cyberpunk, glassmorphism)_
    - _Expected_Behavior: 7 themes exist with complete CSS variable definitions_
    - _Preservation: Existing 5 themes unchanged from design.md Section 6.3_
    - _Requirements: 3.4, 7.1_

  - [ ] 3.3 Update ThemeProvider type definition
    - Open `frontend/src/components/providers/ThemeProvider.tsx`
    - Update `type Theme` to include 'sublime' and 'nord'
    - Change from: `type Theme = 'dark' | 'light' | 'amoled' | 'cyberpunk' | 'glassmorphism';`
    - Change to: `type Theme = 'dark' | 'light' | 'amoled' | 'cyberpunk' | 'glassmorphism' | 'sublime' | 'nord';`
    - **DO NOT** modify any other ThemeProvider logic
    - _Bug_Condition: Theme type doesn't include new themes_
    - _Expected_Behavior: Theme type includes all 7 themes_
    - _Preservation: All ThemeProvider logic preserved from design.md Section 6.3_
    - _Requirements: 3.4, 4.3_

  - [ ] 3.4 Refactor TransactionItem component (Critical Priority)
    - Open `frontend/src/components/ui/TransactionItem.tsx`
    - Search for all hard-coded colors using regex: `(bg-\[|text-\[|border-\[|#[0-9a-fA-F]{3,6})`
    - Replace each hard-coded color using mapping from design.md Section 4.2:
      - `bg-[#141420]` → `bg-bg-card`
      - `border-[#26263a]` → `border-border`
      - `hover:bg-[#1a1a2b]` → `hover:bg-bg-hover`
      - `text-[#ffffff]` → `text-text-primary`
      - `text-[#8888a8]` → `text-text-secondary`
      - `text-[#a0a0cc]` → `text-text-secondary`
      - `bg-[#1e1e2e]` → `bg-bg-secondary`
      - `border-[#2d2d44]` → `border-border-subtle`
      - And all other hard-coded colors (25+ instances)
    - Follow refactoring pattern from design.md Section 5.1
    - Test component in dark and light themes to verify changes
    - _Bug_Condition: TransactionItem uses 25+ hard-coded color values_
    - _Expected_Behavior: TransactionItem uses only CSS variable-based classes_
    - _Preservation: Component functionality unchanged, only color classes updated_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.5 Refactor SmoothSelect component (Critical Priority)
    - Open `frontend/src/components/ui/SmoothSelect.tsx`
    - Search for all hard-coded colors
    - Replace using mapping from design.md Section 4.2:
      - `bg-[#10101a]` → `bg-bg-secondary`
      - `bg-[#141420]` → `bg-bg-card`
      - `border-[#2b2b40]` → `border-border`
      - `border-[#6c63ff]` → `border-accent`
      - `ring-[#6c63ff]/30` → `ring-accent/30`
      - `text-[#c0c0e0]` → `text-text-primary`
      - `text-[#8888a8]` → `text-text-secondary`
      - And all other instances (15+ instances)
    - Follow refactoring pattern from design.md Section 5.2
    - Test in all themes
    - _Bug_Condition: SmoothSelect uses 15+ hard-coded color values_
    - _Expected_Behavior: SmoothSelect uses only CSS variable-based classes_
    - _Preservation: Dropdown functionality preserved_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.6 Refactor DateRangePicker component (Critical Priority)
    - Open `frontend/src/components/ui/DateRangePicker.tsx`
    - Search for all hard-coded colors
    - Replace using mapping from design.md Section 4.2:
      - All `bg-[#...]` → appropriate `bg-bg-*` classes
      - All `text-[#...]` → appropriate `text-text-*` classes
      - All `border-[#...]` → appropriate `border-border*` classes
      - 20+ instances total
    - Test date picker interactions in all themes
    - _Bug_Condition: DateRangePicker uses 20+ hard-coded color values_
    - _Expected_Behavior: DateRangePicker uses only CSS variable-based classes_
    - _Preservation: Date selection functionality preserved_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.7 Refactor chart components (High Priority)
    - Open `frontend/src/components/charts/PieChart.tsx`
    - Replace conditional theme logic with dynamic CSS variable retrieval:
      ```typescript
      // Before:
      const textColor = theme === 'light' ? '#555577' : '#8888a8';
      
      // After:
      const textColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary').trim();
      ```
    - Apply to: textColor, tooltipBg, gridColor
    - Open `frontend/src/components/charts/AreaChart.tsx`
    - Apply same pattern
    - Follow refactoring pattern from design.md Section 5.3
    - Test charts render correctly in all themes
    - _Bug_Condition: Charts use conditional hex color logic_
    - _Expected_Behavior: Charts dynamically read CSS variables_
    - _Preservation: Chart rendering and interactions preserved_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.8 Refactor modal components (High Priority)
    - Open `frontend/src/components/modals/SettleLentBorrowModal.tsx`
    - Replace all hard-coded colors (15+ instances)
    - Follow pattern from design.md Section 5.4
    - Repeat for all other modal components:
      - `ManageAccountTypesModal.tsx`
      - All other modal components found with hard-coded colors
    - Test modal open/close and interactions in all themes
    - _Bug_Condition: Modals use hard-coded color values_
    - _Expected_Behavior: Modals use CSS variable-based classes_
    - _Preservation: Modal functionality preserved_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.9 Refactor widget components (Medium Priority)
    - Open `frontend/src/components/ui/FinancialHealthWidget.tsx`
    - Replace all hard-coded colors (10+ instances)
    - Open `frontend/src/components/ui/RecurringBillsWidget.tsx`
    - Replace all hard-coded colors (5+ instances)
    - Test widgets in all themes
    - _Bug_Condition: Widgets use hard-coded color values_
    - _Expected_Behavior: Widgets use CSS variable-based classes_
    - _Preservation: Widget functionality preserved_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.10 Search and refactor remaining components
    - Run comprehensive search: `grep -r "bg-\[#" frontend/src/components/`
    - Run comprehensive search: `grep -r "text-\[#" frontend/src/components/`
    - Run comprehensive search: `grep -r "border-\[#" frontend/src/components/`
    - For each file with matches:
      - Open file
      - Replace hard-coded colors with CSS variable classes
      - Use mapping table from design.md Section 4.2
      - Test in multiple themes
    - Verify zero remaining hard-coded colors
    - _Bug_Condition: Any remaining components with hard-coded colors_
    - _Expected_Behavior: All components use CSS variable-based classes_
    - _Preservation: All component functionality preserved_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1_

  - [ ] 3.11 Update theme selector UI
    - Open `frontend/src/components/layout/Header.tsx`
    - Locate themes array (around line 14)
    - Add new theme entries:
      ```typescript
      { id: 'sublime', label: 'Sublime Text' },
      { id: 'nord', label: 'Nord' },
      ```
    - Ensure all 7 themes appear in dropdown
    - Test theme selector displays all themes
    - Test selecting each theme switches correctly
    - _Bug_Condition: Theme selector only shows 5 themes_
    - _Expected_Behavior: Theme selector shows all 7 themes_
    - _Preservation: Theme selector functionality preserved_
    - _Requirements: 3.4, 7.1_

  - [ ] 3.12 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Hard-coded colors now respond to theme changes
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from task 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all assertions pass:
      - TransactionItem colors update on theme switch ✅
      - SmoothSelect colors update on theme switch ✅
      - DateRangePicker colors update on theme switch ✅
      - All colors match new theme palette ✅
    - Document test results
    - _Requirements: 3.1, 3.2, 3.3, 5.1_

  - [ ] 3.13 Verify preservation tests still pass
    - **Property 2: Preservation** - Components already using CSS variables unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify all assertions pass:
      - Header component behavior unchanged ✅
      - Components using `.card` class unchanged ✅
      - Components already using CSS variables unchanged ✅
    - Confirm no visual regressions
    - Document test results
    - _Requirements: 4.1, 4.2, 4.3, 5.2_

- [ ] 4. Production build and comprehensive testing

  - [ ] 4.1 Run production build
    - Navigate to frontend directory: `cd frontend`
    - Run build command: `npm run build`
    - Verify exit code 0 (success)
    - Verify zero build errors
    - Verify zero TypeScript errors
    - Document build output
    - _Requirements: 4.3, 7.2, 9.1_

  - [ ] 4.2 Run type checking and linting
    - Run: `npm run type-check`
    - Verify no TypeScript errors
    - Run: `npm run lint`
    - Verify no linting errors related to changes
    - Fix any issues found
    - _Requirements: 7.2, 9.1_

  - [ ] 4.3 Test all themes across all pages
    - For each theme (dark, light, amoled, cyberpunk, glassmorphism, sublime, nord):
      - Navigate to each page from testing checklist (Section 8.1 of design.md):
        - Dashboard
        - Accounts
        - Transactions
        - Budgets
        - Categories
        - Goals
        - Bills & Recurring
        - Debt Planner
        - Financial Health
        - Lent/Borrow
        - Reports
        - Settings
        - Profile
      - Verify complete theme application (no mixed colors)
      - Verify all components use correct theme colors
      - Document any issues found
    - Complete manual testing checklist from design.md Section 8.4
    - _Requirements: 3.1, 3.2, 5.1, 7.1, 8.1, 8.2, 8.3_

  - [ ] 4.4 Test component interactions in all themes
    - For each theme:
      - Test button hover states
      - Test button focus states
      - Test form input focus states
      - Test dropdown open/close (SmoothSelect)
      - Test modal open/close
      - Test date picker interactions
      - Test chart tooltips
      - Verify all interactions use theme colors
    - Document results
    - _Requirements: 3.1, 3.2, 8.3_

  - [ ] 4.5 Rebuild with Docker Compose
    - Navigate to project root
    - Stop existing containers: `docker-compose down`
    - Rebuild and start: `docker-compose up --build`
    - Verify successful build
    - Verify application starts without errors
    - Test all themes in Docker environment
    - _Requirements: 4.3, 7.2, 9.1_

  - [ ] 4.6 Manual user acceptance testing
    - Switch between all themes multiple times
    - Verify immediate and complete theme application
    - Test theme persistence (refresh browser, verify theme persists)
    - Test across different browsers (Chrome, Firefox, Safari, Edge)
    - Navigate between all pages with different themes
    - Verify no visual inconsistencies or bugs
    - Document any issues for resolution
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 7.1, 7.2, 8.1, 8.2, 8.3_

- [ ] 5. Checkpoint - Ensure all tests pass and fixes are complete
  - Verify all exploration tests pass (bug is fixed)
  - Verify all preservation tests pass (no regressions)
  - Verify production build succeeds
  - Verify all 7 themes work across all 13 pages
  - Verify Docker Compose rebuild succeeds
  - Ensure user has tested and approved changes
  - Ask the user if any questions or issues arise
  - _Requirements: All requirements 1.1-9.3_

---

## Implementation Notes

### Priority Sequence
1. **Setup** (Tasks 1-2): Write tests first to understand bug and preserve baseline
2. **Configuration** (Tasks 3.1-3.3): Update Tailwind config, add themes, update types
3. **Critical Components** (Tasks 3.4-3.6): TransactionItem, SmoothSelect, DateRangePicker
4. **High Priority** (Tasks 3.7-3.8): Charts and modals
5. **Medium Priority** (Tasks 3.9-3.10): Widgets and remaining components
6. **Finalization** (Tasks 3.11-3.13): Theme selector and test verification
7. **Validation** (Task 4): Production build and comprehensive testing

### Testing Strategy
- **Exploration Tests (Task 1)**: MUST FAIL on unfixed code, PASS after fix
- **Preservation Tests (Task 2)**: MUST PASS on unfixed code, PASS after fix
- **Manual Testing (Task 4.3-4.6)**: Comprehensive across all themes and pages

### Success Criteria
- ✅ Zero hard-coded colors remain in codebase
- ✅ All 7 themes apply completely across all pages
- ✅ No mixed theme appearance (all one theme, never mixed)
- ✅ Production build succeeds with zero errors
- ✅ Docker Compose rebuild succeeds
- ✅ All tests pass (exploration + preservation)
- ✅ User acceptance testing confirms fix

### Color Mapping Quick Reference
| Hard-Coded | CSS Variable Class |
|------------|-------------------|
| `bg-[#141420]` | `bg-bg-card` |
| `bg-[#10101a]` | `bg-bg-secondary` |
| `text-[#ffffff]` | `text-text-primary` |
| `text-[#8888a8]` | `text-text-secondary` |
| `border-[#26263a]` | `border-border` |
| `border-[#2d2d44]` | `border-border-subtle` |
| `hover:bg-[#1a1a2b]` | `hover:bg-bg-hover` |
| `border-[#6c63ff]` | `border-accent` |

For complete mapping, refer to design.md Section 4.2.

---

## References
- **Bugfix Specification**: `bugfix.md` - Bug condition, expected behavior, preservation requirements
- **Design Document**: `design.md` - Technical specifications, color mappings, refactoring patterns
- **Bug Condition Methodology**: Sections 2-4 in bugfix.md
- **Color Mapping Table**: Section 4.2 in design.md
- **Refactoring Examples**: Section 5 in design.md
- **Testing Strategy**: Section 8 in design.md
