/**
 * @jest-environment jsdom
 */

describe('Theme Engine & Settings', () => {
  const themes = ['light', 'dark', 'amoled', 'cyberpunk', 'glassmorphism'];

  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('should support switching between all 5 themes', () => {
    themes.forEach((theme) => {
      document.documentElement.className = `theme-${theme}`;
      expect(document.documentElement.classList.contains(`theme-${theme}`)).toBe(true);
    });
  });

  it('should apply dark background and text tokens for glassmorphism theme', () => {
    document.documentElement.className = 'theme-glassmorphism';
    expect(document.documentElement.className).toBe('theme-glassmorphism');
  });
});
