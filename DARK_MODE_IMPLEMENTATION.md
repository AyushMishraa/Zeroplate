# Dark Mode Implementation - ZeroPlate

## Overview
A complete dark mode toggle feature has been implemented for the ZeroPlate application. The toggle button is placed in the navbar and applies dark mode styling throughout the entire application dynamically.

## Features Implemented

### 1. **Dark Mode Toggle Button**
- **Location**: Navbar (right side, next to user menu)
- **UI Elements**: 
  - Shows 🌙 `dark_mode` icon in light mode
  - Shows ☀️ `light_mode` icon in dark mode
  - Smooth transitions with hover effects and animations
  - Responsive and mobile-friendly

### 2. **Theme Service**
- **File**: `src/app/core/services/theme.service.ts`
- **Features**:
  - `toggleTheme()` - Toggle between light and dark mode
  - `setTheme(isDark: boolean)` - Set theme explicitly
  - `getCurrentTheme()` - Get current theme state
  - `isDarkMode$` - Observable for reactive updates
  - Persists theme preference to localStorage
  - Auto-detects system preference on first visit

### 3. **Dynamic Styling**
- **Global Styles**: `src/styles.scss`
  - Dark mode CSS variables and overrides
  - Material Design Component dark mode support
  - Smooth transitions for all theme changes
  - Custom scrollbar styling for dark mode

- **Home Component Styles**: `src/app/features/home/home.component.scss`
  - Dark mode styles for all home page elements
  - Feature cards, stat cards, testimonials
  - Hero section and CTA sections
  - Footer styling
  - Smooth color transitions

### 4. **Material Design Component Support**
Dark mode styles configured for:
- Toolbars and Navigation
- Cards and Panels
- Buttons and Form Controls
- Menus and Dropdowns
- Dialogs and Modals
- Tables and Lists
- Tabs and Accordions
- Progress Indicators
- Snackbars and Toasts
- Input Fields and Selects

### 5. **Color Palette**

#### Light Mode
- Background: `#ffffff`
- Text: `#111827`
- Secondary Text: `#6b7280`
- Primary: `#6366f1`
- Hover: `rgba(99, 102, 241, 0.08)`

#### Dark Mode
- Background: `#0f172a`
- Surface: `#1e293b`
- Text: `#f1f5f9`
- Secondary Text: `#cbd5e1`
- Primary: `#818cf8` (adjusted for dark mode)
- Hover: `rgba(99, 102, 241, 0.15)`

## Files Modified

### 1. **App Component**
- `src/app/app.component.ts`
  - Injected `ThemeService` to initialize theme on app startup

### 2. **Home Component**
- `src/app/features/home/home.component.ts`
  - Added `ThemeService` import and dependency injection
  - Added `isDarkMode$` observable for template binding
  - Added `toggleDarkMode()` method
  - Added `MatSlideToggleModule` import

- `src/app/features/home/home.component.html`
  - Added dark mode toggle button in navbar
  - Uses conditional rendering with `@if (isDarkMode$ | async)`
  - Shows/hides sun/moon icons based on theme state

- `src/app/features/home/home.component.scss`
  - Added 400+ lines of dark mode styles
  - Theme toggle button styles with animations
  - Dark mode overrides for all page sections
  - Smooth transitions for theme switching

### 3. **Global Styles**
- `src/styles.scss`
  - Added comprehensive dark mode support
  - Material component dark mode overrides
  - Scrollbar styling
  - Transition animations
  - Form controls and inputs in dark mode

## How It Works

1. **Initialization**: 
   - When the app loads, `ThemeService` checks `localStorage` for saved theme
   - If none found, checks system preference via `prefers-color-scheme` media query
   - Applies the appropriate theme class to `<html>` element

2. **Toggle**:
   - User clicks the moon/sun icon in the navbar
   - `toggleDarkMode()` is called
   - Theme state updates via Observable
   - `dark-mode` class is added/removed from `<html>` element
   - Preference is saved to localStorage

3. **Styling**:
   - CSS uses `:host-context(html.dark-mode)` selector
   - All dark mode styles automatically apply when class is present
   - Smooth CSS transitions provide visual feedback
   - Material components automatically respect the theme

## Usage

### For Users
1. Click the moon icon (🌙) in the navbar to enable dark mode
2. Click the sun icon (☀️) to return to light mode
3. Theme preference is automatically saved and persists across sessions

### For Developers
```typescript
// Inject the ThemeService
constructor(private themeService: ThemeService) {}

// Toggle theme
this.themeService.toggleTheme();

// Set theme explicitly
this.themeService.setTheme(true); // dark mode
this.themeService.setTheme(false); // light mode

// Get current theme
const isDark = this.themeService.getCurrentTheme();

// Subscribe to theme changes
this.themeService.isDarkMode$.subscribe(isDark => {
  console.log('Theme changed to:', isDark ? 'dark' : 'light');
});
```

## Browser Support
- All modern browsers with CSS3 support
- CSS custom properties (CSS variables)
- LocalStorage API
- CSS Grid and Flexbox
- CSS transitions and animations

## Testing the Feature

1. **Click the toggle button** in the navbar - the entire app theme should change instantly
2. **Refresh the page** - theme preference should persist
3. **Check browser DevTools** - look for `dark-mode` class on `<html>` element
4. **Inspect localStorage** - verify `zeroplate-theme` key is set to 'dark' or 'light'
5. **Open in a new browser window** - system preference should be used if no saved preference

## Future Enhancements
- Add theme selection dropdown (light, dark, auto/system)
- Implement more color schemes (blue, green, etc.)
- Add animated theme transition effects
- Store theme preference in user profile (for logged-in users)
- Add theme preview in settings page
