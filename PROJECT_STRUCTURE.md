# GiraffeSpace - Professional Project Structure

## 📁 Root Directory Structure

```
giraffe-space/
├── 📁 app/                          # Next.js App Router pages
├── 📁 src/                          # Source code (new organized structure)
│   ├── 📁 components/               # Reusable components
│   │   ├── 📁 ui/                   # Base UI components (shadcn/ui)
│   │   ├── 📁 forms/                # Form components
│   │   ├── 📁 layout/               # Layout components
│   │   ├── 📁 cards/                # Card components
│   │   ├── 📁 navigation/           # Navigation components
│   │   ├── 📁 feedback/             # Feedback components (alerts, toasts, etc.)
│   │   └── 📁 business/             # Business-specific components
│   ├── 📁 hooks/                    # Custom React hooks
│   ├── 📁 contexts/                 # React contexts
│   ├── 📁 lib/                      # Utility libraries and configurations
│   ├── 📁 utils/                    # Utility functions
│   ├── 📁 types/                    # TypeScript type definitions
│   ├── 📁 constants/                # Application constants
│   ├── 📁 services/                 # API services and external integrations
│   └── 📁 styles/                   # Global styles and theme
├── 📁 public/                       # Static assets
├── 📁 docs/                         # Documentation
└── 📁 scripts/                      # Build and deployment scripts
```

## 🧩 Components Organization

### UI Components (`src/components/ui/`)
- Base components from shadcn/ui
- Highly reusable, no business logic
- Examples: Button, Input, Card, Modal, etc.

### Form Components (`src/components/forms/`)
- Form-specific components
- Examples: FormField, FormSection, FormValidation, etc.

### Layout Components (`src/components/layout/`)
- Layout and structural components
- Examples: Header, Footer, Sidebar, Container, etc.

### Card Components (`src/components/cards/`)
- Card-based UI components
- Examples: EventCard, OrganizationCard, StatCard, etc.

### Navigation Components (`src/components/navigation/`)
- Navigation-related components
- Examples: Navbar, Breadcrumb, Pagination, etc.

### Feedback Components (`src/components/feedback/`)
- User feedback components
- Examples: Toast, Alert, Loading, ErrorBoundary, etc.

### Business Components (`src/components/business/`)
- Domain-specific components
- Examples: EventForm, OrganizationForm, UserDashboard, etc.

## 🔧 Utilities and Services

### Hooks (`src/hooks/`)
- Custom React hooks
- Examples: useAuth, useApi, useLocalStorage, etc.

### Contexts (`src/contexts/`)
- React context providers
- Examples: AuthContext, ThemeContext, etc.

### Services (`src/services/`)
- API calls and external integrations
- Examples: authService, eventService, etc.

### Utils (`src/utils/`)
- Pure utility functions
- Examples: dateUtils, validationUtils, etc.

### Types (`src/types/`)
- TypeScript type definitions
- Examples: api.types.ts, component.types.ts, etc.

## 📋 Migration Plan

1. **Phase 1**: Create new directory structure
2. **Phase 2**: Move and reorganize existing components
3. **Phase 3**: Update imports and references
4. **Phase 4**: Clean up old directories
5. **Phase 5**: Add documentation and examples

## 🎯 Benefits of This Structure

- **Scalability**: Easy to add new features and components
- **Maintainability**: Clear separation of concerns
- **Reusability**: Components are organized by purpose
- **Team Collaboration**: Consistent structure for all developers
- **Testing**: Easier to write and organize tests
- **Performance**: Better tree-shaking and code splitting
