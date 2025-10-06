# Frontend Design Style Guide

## Overview
This style guide documents the design system and patterns used in the Client Confirmation Manager frontend application. It serves as a reference for maintaining design consistency across current and future applications.

## Color Palette

### Dark Theme Variables
```css
--bg-primary: #1a1a1a      /* Main background */
--bg-secondary: #2d2d2d    /* Card backgrounds, panels */
--bg-tertiary: #3a3a3a     /* Hover states, input backgrounds */
--text-primary: #ffffff    /* Main text color */
--text-secondary: #b3b3b3  /* Secondary text, descriptions */
--accent-blue: #4a9eff     /* Primary accent color */
--accent-green: #00c851    /* Success states */
--accent-red: #ff4444      /* Error states, delete actions */
--accent-yellow: #ffbb33   /* Warning states */
--border-color: #404040    /* Borders, dividers */
--shadow-color: rgba(0, 0, 0, 0.3) /* Drop shadows */
```

### Usage Guidelines
- **Primary backgrounds**: Use `--bg-primary` for main application background
- **Secondary backgrounds**: Use `--bg-secondary` for cards, panels, modals
- **Interactive elements**: Use `--bg-tertiary` for hover states and input fields
- **Text hierarchy**: `--text-primary` for headings and important text, `--text-secondary` for descriptions
- **Accent colors**: `--accent-blue` for primary actions, other accent colors for specific states

## Typography

### Font Family
```css
font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Weights & Sizes
- **Headings**: 600 weight, varying sizes (1.5rem for h1, 1.25rem for h2, etc.)
- **Body text**: 400 weight, 14px base size
- **Small text**: 12-13px for secondary information
- **Button text**: 500-600 weight for emphasis

### Text Styling
```css
/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

/* Body text */
body {
  line-height: 1.6;
  color: var(--text-primary);
}
```

## Layout Patterns

### Application Structure
```
┌─────────────────────────────────────┐
│ Top Banner (80px fixed height)     │
├─────────────────────────────────────┤
│                                     │
│ Main Content Area                   │
│ (flex: 1, overflow handling)       │
│                                     │
└─────────────────────────────────────┘
```

### Dashboard Layouts

#### Three-Panel Layout (Client Dashboard)
```css
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  gap: 20px;
}

.top-panels {
  display: flex;
  gap: 20px;
  height: 50%;
}

.bottom-panel {
  flex: 1;
  /* Collapsible functionality */
}
```

#### Admin Panel Layout
```css
.admin-dashboard {
  padding: 1.5rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.admin-title {
  margin-left: auto; /* Right-aligned title */
  font-weight: 600;
}
```

## Component Patterns

### Cards
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--bg-tertiary);
}
```

### Buttons

#### Primary Button
```css
.primary-button {
  background: var(--accent-blue);
  border: none;
  border-radius: 6px;
  color: white;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button:hover {
  background: #3876ca;
  transform: translateY(-1px);
}
```

#### Secondary Button
```css
.secondary-button {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
```

#### Gradient Button (Special Actions)
```css
.gradient-button {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
  border: none;
  border-radius: 6px;
  color: white;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.gradient-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
}
```

### Tab Navigation
```css
.tab-button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: var(--accent-blue);
  border-bottom-color: var(--accent-blue);
}
```

### Form Elements
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px 16px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}
```

### Modals
```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 450px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

## Interactive Elements

### Hover States
- **Cards/Buttons**: Background color change + slight transform
- **Language flags**: Scale and opacity change
- **Tab buttons**: Background highlight

### Focus States
- **Form inputs**: Blue border + subtle shadow
- **Buttons**: Consistent with hover + outline

### Loading States
- Use consistent loading indicators
- Disable buttons during operations
- Show progress feedback

## Data Tables

### AG Grid Customization
```css
.trade-grid .ag-header {
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.trade-grid .ag-row:hover {
  background-color: var(--bg-tertiary);
}

.trade-grid .ag-row-selected {
  background-color: rgba(74, 158, 255, 0.1);
}
```

### Status Indicators
- **Success/Matched**: Green background with white text
- **Warning/Disputed**: Yellow background with dark text
- **Error/Unmatched**: Red background with white text
- **Neutral/Pending**: Gray background with white text

## Spacing System

### Base Unit: 4px
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **xxl**: 48px (3rem)

### Application
- **Component padding**: 16px-24px
- **Card gaps**: 20px
- **Form element spacing**: 12px-16px
- **Section margins**: 24px-32px

## Internationalization (i18n)

### Pattern
```typescript
// Always use translation keys
{t('section.subsection.key')}

// For interpolation
{t('admin.dataMapping.saveMapping.successMessage').replace('{name}', mappingName)}
```

### Key Structure
```json
{
  "section": {
    "subsection": {
      "key": "Translated text",
      "formFields": {
        "label": "Field Label",
        "placeholder": "Field placeholder"
      }
    }
  }
}
```

## Animation & Transitions

### Standard Transitions
```css
transition: all 0.2s ease;
```

### Hover Animations
- **Buttons**: `transform: translateY(-1px)`
- **Cards**: Background color change
- **Icons**: Scale and opacity changes

### Modal Animations
- **Entry**: Scale up from 0.9 to 1.0 with fade in
- **Exit**: Fade out with backdrop blur

## Responsive Design

### Breakpoints
- **Mobile**: 768px and below
- **Tablet**: 769px - 1199px
- **Desktop**: 1200px and above

### Responsive Patterns
```css
@media (max-width: 768px) {
  .dashboard-sections {
    grid-template-columns: 1fr;
  }
  
  .top-panels {
    flex-direction: column;
  }
}
```

## File Upload Components

### Drag & Drop Areas
```css
.file-upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
}

.file-upload-area.drag-over {
  border-color: var(--accent-blue);
  background: rgba(74, 158, 255, 0.05);
}
```

## Error Handling

### Alert Types
- **Success**: Green left border, checkmark icon
- **Warning**: Yellow left border, warning icon
- **Error**: Red left border, error icon
- **Info**: Blue left border, info icon

## Best Practices

### CSS Organization
1. **Variables first**: Define CSS custom properties
2. **Base styles**: Reset, typography, global styles
3. **Layout components**: Grid, flex patterns
4. **UI components**: Buttons, forms, cards
5. **Responsive**: Mobile-first approach

### Component Structure
1. **Container**: Main wrapper with proper spacing
2. **Header**: Title and action buttons
3. **Content**: Main component content
4. **Footer**: Secondary actions if needed

### Accessibility
- Maintain color contrast ratios
- Use semantic HTML elements
- Provide proper focus indicators
- Include ARIA labels where needed

### Performance
- Use CSS transforms for animations
- Minimize repaints with `will-change`
- Optimize images and assets
- Use CSS variables for theming

## Asset Guidelines

### Logo Usage
- **Height**: 55px for main logo
- **Format**: SVG preferred, PNG fallback
- **Placement**: Left side of top banner

### Flag Icons
- **Size**: 28x20px
- **Border radius**: 3px
- **Active state**: Blue border

This style guide ensures consistency across all frontend applications and provides a solid foundation for future development.