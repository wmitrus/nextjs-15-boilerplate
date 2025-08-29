# Accessibility Manual Checks Guide

## Overview

This document covers the 10 accessibility items that require manual verification, as automated tools cannot fully assess these areas. Each item includes implementation guidance and code examples specific to your Next.js 15 boilerplate.

## Manual Accessibility Checks

### 1. Interactive Controls are Keyboard Focusable

**Status**: Requires verification
**WCAG Guideline**: 2.1.1 Keyboard

**What to Check**:

- All interactive elements (buttons, links, form controls) must be focusable via keyboard
- Tab order should be logical and intuitive
- Focus indicators should be visible

**Current Code Analysis**:

```tsx
// page.tsx - Current button implementation
<a
  href="#features"
  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
>
  Explore Features
</a>
```

**Issues Found**:

- ✅ Focus indicators present (`focus-visible:outline`)
- ❌ Missing `tabIndex` for custom interactive elements
- ❌ No skip links for keyboard navigation

**Implementation**:

```tsx
// components/SkipLink.tsx
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only z-50 rounded bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
  >
    Skip to main content
  </a>
);

// Enhanced button with proper focus management
<button
  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
  onClick={handleClick}
>
  Explore Features
</button>;
```

### 2. Interactive Elements Indicate Their Purpose and State

**Status**: Requires verification
**WCAG Guideline**: 1.3.1 Info and Relationships

**What to Check**:

- Elements should clearly indicate their function
- State changes (hover, focus, active) should be communicated
- Screen readers should announce element purposes

**Current Code Analysis**:

```tsx
// page.tsx - Current feature flags display
<span
  className={`h-3 w-3 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
></span>
```

**Issues Found**:

- ❌ Color-only state indication (not accessible)
- ❌ Missing ARIA labels for state changes
- ❌ No screen reader announcements for dynamic content

**Implementation**:

```tsx
// components/FeatureStatus.tsx
interface FeatureStatusProps {
  enabled: boolean;
  name: string;
}

export const FeatureStatus = ({ enabled, name }: FeatureStatusProps) => (
  <div className="flex items-center space-x-2">
    <span
      className={`h-3 w-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
      aria-hidden="true"
    />
    <span className="sr-only">
      {name} is {enabled ? 'enabled' : 'disabled'}
    </span>
    <span
      aria-live="polite"
      aria-atomic="true"
      className="text-sm text-gray-600"
    >
      {enabled ? 'Active' : 'Inactive'}
    </span>
  </div>
);
```

### 3. The Page Has a Logical Tab Order

**Status**: Requires verification
**WCAG Guideline**: 2.4.3 Focus Order

**What to Check**:

- Tab order follows the visual layout
- Interactive elements are reachable in logical sequence
- No keyboard traps or confusing navigation patterns

**Current Code Analysis**:

```tsx
// page.tsx - Current layout structure
<header>
  <nav>
    {/* Navigation items */}
  </nav>
</header>
<main>
  {/* Main content */}
</main>
<footer>
  {/* Footer content */}
</footer>
```

**Issues Found**:

- ✅ Logical DOM structure
- ❌ Missing `tabindex` management for complex components
- ❌ No focus management for modal dialogs

**Implementation**:

```tsx
// hooks/useFocusManagement.ts
export const useFocusManagement = () => {
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const elements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    setFocusableElements(Array.from(elements) as HTMLElement[]);
  }, []);

  const moveFocus = (direction: 'next' | 'prev') => {
    const currentIndex = focusableElements.findIndex(
      (el) => el === document.activeElement,
    );

    let nextIndex;
    if (direction === 'next') {
      nextIndex =
        currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1;
    } else {
      nextIndex =
        currentIndex - 1 < 0 ? focusableElements.length - 1 : currentIndex - 1;
    }

    focusableElements[nextIndex]?.focus();
  };

  return { moveFocus };
};
```

### 4. Visual Order on the Page Follows DOM Order

**Status**: Requires verification
**WCAG Guideline**: 1.3.2 Meaningful Sequence

**What to Check**:

- Screen reader navigation matches visual layout
- CSS positioning doesn't break logical content flow
- Flexbox and Grid layouts maintain logical order

**Current Code Analysis**:

```tsx
// page.tsx - Current grid layout
<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
  {/* Feature cards */}
</div>
```

**Issues Found**:

- ✅ Semantic HTML structure
- ❌ CSS Grid/Flexbox order might differ from DOM order
- ❌ Absolute positioning could break logical flow

**Implementation**:

```tsx
// components/AccessibleGrid.tsx
interface AccessibleGridProps {
  children: React.ReactNode;
  className?: string;
}

export const AccessibleGrid = ({
  children,
  className,
}: AccessibleGridProps) => (
  <div className={className} role="grid" aria-label="Feature grid">
    {React.Children.map(children, (child, index) => (
      <div
        key={index}
        role="gridcell"
        tabIndex={0}
        className="focus:outline focus:outline-2 focus:outline-indigo-500"
      >
        {child}
      </div>
    ))}
  </div>
);
```

### 5. User Focus is Not Accidentally Trapped in a Region

**Status**: Requires verification
**WCAG Guideline**: 2.1.2 No Keyboard Trap

**What to Check**:

- Users can exit modal dialogs and menus
- Infinite scroll doesn't trap focus
- Custom widgets allow keyboard escape

**Current Code Analysis**:

- No modal dialogs currently implemented
- No complex interactive regions identified

**Implementation**:

```tsx
// components/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="modal-overlay"
    >
      <div className="modal-content">
        {children}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="modal-close"
        >
          ×
        </button>
      </div>
    </div>
  );
};
```

### 6. The User's Focus is Directed to New Content Added to the Page

**Status**: Requires verification
**WCAG Guideline**: 3.2.2 On Input

**What to Check**:

- Form submissions redirect focus appropriately
- Dynamic content loads announce changes
- Status messages are properly communicated

**Current Code Analysis**:

```tsx
// page.tsx - Environment info section
<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {/* Dynamic content */}
</div>
```

**Issues Found**:

- ❌ No ARIA live regions for dynamic content
- ❌ Focus management for content updates
- ❌ Status announcements for state changes

**Implementation**:

```tsx
// components/LiveAnnouncer.tsx
interface LiveAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export const LiveAnnouncer = ({
  message,
  priority = 'polite',
}: LiveAnnouncerProps) => (
  <div aria-live={priority} aria-atomic="true" className="sr-only">
    {message}
  </div>
);

// Usage in components
const [announcement, setAnnouncement] = useState('');

useEffect(() => {
  if (feature.enabled) {
    setAnnouncement(`${feature.name} has been enabled`);
  }
}, [feature.enabled]);

return (
  <>
    <LiveAnnouncer message={announcement} />
    {/* Component content */}
  </>
);
```

### 7. HTML5 Landmark Elements are Used to Improve Navigation

**Status**: Requires verification
**WCAG Guideline**: 1.3.1 Info and Relationships

**What to Check**:

- Proper use of `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`
- Landmark elements are not overused
- Screen readers can navigate using landmarks

**Current Code Analysis**:

```tsx
// page.tsx - Current structure
<header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
  {/* Header content */}
</header>

<main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
  {/* Main content */}
</main>

<footer className="border-t border-gray-200 bg-white">
  {/* Footer content */}
</footer>
```

**Issues Found**:

- ✅ Basic landmark elements present
- ❌ Missing `<nav>` element for navigation
- ❌ No `<aside>` for supplementary content
- ❌ Missing `role` attributes where needed

**Implementation**:

```tsx
// layout.tsx - Enhanced landmark structure
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <header role="banner">
            <nav role="navigation" aria-label="Main navigation">
              {/* Navigation content */}
            </nav>
          </header>

          <main id="main-content" role="main">
            {children}
          </main>

          <aside role="complementary" aria-label="Additional information">
            {/* Sidebar content */}
          </aside>

          <footer role="contentinfo">{/* Footer content */}</footer>
        </div>
      </body>
    </html>
  );
}
```

### 8. Offscreen Content is Hidden from Assistive Technology

**Status**: Requires verification
**WCAG Guideline**: 1.3.2 Meaningful Sequence

**What to Check**:

- Hidden content doesn't interfere with screen readers
- CSS `display: none` and `visibility: hidden` are used appropriately
- `aria-hidden` is used correctly for decorative content

**Current Code Analysis**:

```tsx
// page.tsx - Current decorative elements
<div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
```

**Issues Found**:

- ❌ Decorative elements missing `aria-hidden="true"`
- ❌ Screen reader only content not properly implemented
- ❌ Focusable elements in hidden regions

**Implementation**:

```tsx
// components/ScreenReaderOnly.tsx
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenReaderOnly = ({ children, className }: ScreenReaderOnlyProps) => (
  <span className={`sr-only ${className || ''}`}>
    {children}
  </span>
);

// Enhanced decorative elements
<div
  className="h-8 w-8 rounded-lg bg-indigo-600"
  aria-hidden="true"
  role="presentation"
/>

// Screen reader announcements
<ScreenReaderOnly>
  Navigation menu with {menuItems.length} items
</ScreenReaderOnly>
```

### 9. Custom Controls Have Associated Labels

**Status**: Requires verification
**WCAG Guideline**: 1.3.1 Info and Relationships

**What to Check**:

- Custom form controls have proper labels
- ARIA labels are descriptive and accurate
- Label relationships are correctly established

**Current Code Analysis**:

```tsx
// Current form-like elements
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-600">New Dashboard</span>
  <span
    className={`h-3 w-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
  ></span>
</div>
```

**Issues Found**:

- ❌ Custom controls missing labels
- ❌ No ARIA labeling for complex widgets
- ❌ Missing fieldsets and legends for grouped controls

**Implementation**:

```tsx
// components/CustomToggle.tsx
interface CustomToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CustomToggle = ({
  id,
  label,
  checked,
  onChange,
}: CustomToggleProps) => (
  <div className="flex items-center justify-between">
    <label htmlFor={id} className="cursor-pointer text-sm text-gray-600">
      {label}
    </label>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={`${label} is ${checked ? 'enabled' : 'disabled'}`}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);
```

### 10. Custom Controls Have ARIA Roles

**Status**: Requires verification
**WCAG Guideline**: 4.1.2 Name, Role, Value

**What to Check**:

- Custom widgets use appropriate ARIA roles
- Complex interactions are properly conveyed
- Screen readers understand custom control behaviors

**Current Code Analysis**:

- Basic HTML elements used
- No complex custom controls identified

**Implementation**:

```tsx
// components/CustomSelect.tsx
interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  label,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={selectRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label={label}
      className="relative"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
        aria-describedby="select-description"
      >
        {value}
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={`${label} options`}
          className="absolute z-10 w-full border bg-white"
        >
          {options.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              tabIndex={0}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="cursor-pointer p-2 hover:bg-gray-100"
            >
              {option}
            </li>
          ))}
        </ul>
      )}

      <div id="select-description" className="sr-only">
        Select an option from the dropdown list
      </div>
    </div>
  );
};
```

## Implementation Priority

### High Priority (Critical for Accessibility)

1. **Skip Links** - Essential for keyboard navigation
2. **Focus Management** - Required for proper keyboard interaction
3. **ARIA Labels** - Critical for screen reader users
4. **Landmark Elements** - Improves navigation structure

### Medium Priority (Enhanced User Experience)

1. **Live Regions** - For dynamic content announcements
2. **Modal Accessibility** - For dialog interactions
3. **Custom Control Labels** - For complex widgets
4. **Screen Reader Content** - For context and instructions

### Low Priority (Progressive Enhancement)

1. **Advanced Focus Management** - For complex interactions
2. **Custom ARIA Roles** - For specialized widgets
3. **Status Announcements** - For real-time feedback
4. **Accessibility Testing** - Automated verification

## Testing Checklist

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Shift+Tab works in reverse
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate custom controls

### Screen Reader Testing

- [ ] Landmark navigation works
- [ ] Form labels are announced
- [ ] Dynamic content is announced
- [ ] Custom controls are properly described
- [ ] Error messages are communicated

### Visual Focus Indicators

- [ ] Focus outlines are visible
- [ ] Focus indicators have sufficient contrast
- [ ] Focus states don't break layout
- [ ] Custom focus styles are consistent

## Tools for Verification

### Automated Tools

- Lighthouse Accessibility audit
- axe DevTools browser extension
- WAVE Web Accessibility Evaluation Tool
- Accessibility Insights for Web

### Manual Testing

- Keyboard-only navigation
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification
- Zoom testing (200%, 400%)

## Next Steps

1. Implement high-priority accessibility features
2. Test with assistive technologies
3. Create accessibility testing checklist
4. Set up automated accessibility monitoring
5. Train team on accessibility best practices

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Resources](https://webaim.org/resources/)
- [MDN Accessibility Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
