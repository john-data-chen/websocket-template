# User List SPA (websocket template)

[![codecov](https://codecov.io/gh/john-data-chen/websocket-template/graph/badge.svg?token=FoJ3e75P37)](https://codecov.io/gh/john-data-chen/websocket-template)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=john-data-chen_websocket-template&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=john-data-chen_websocket-template)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![CI](https://github.com/john-data-chen/websocket-template/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/john-data-chen/websocket-template/actions/workflows/CI.yml)

## Summary

This project showcases a production-ready SPA architecture built with React and TypeScript, emphasizing real-time collaborative features, robust quality assurance, and efficient development pipelines. It reflects a comprehensive approach to building maintainable and scalable web applications.

**[Click here to view the live demo](https://websocket-template.vercel.app/)**

### Basic Features

- Pops a dialog to ask for username when user first visits the page.
- Input username and click confirm button to login, pops a welcome message with username, save username to session storage.
- Display a list of users, and basic CRUD operations.
- Use form validation to validate inputs. (Use Zod built-in validation to validate email, more details in Technical Decisions)
- Pops a toaster message when multiple users are editing a user at the same time. (Use Socket.io and Sonner)

🌟 Key Accomplishments

- Responsive Design: Ensures optimal user experience across all devices, reflecting a product-centric development approach.
- Exceptional Test Coverage (80%+): Achieved through comprehensive unit tests, significantly reducing potential bugs and enhancing long-term maintainability.
- Reliable User Experience: Validated the critical login flow across all major browsers (Chrome, Safari, Edge) on both desktop and mobile using Playwright E2E tests.
- Superior Code Quality (SonarQube All A Rating): Rigorous analysis confirms high standards in Security, Reliability, and Maintainability, minimizing technical debt and ensuring a healthy codebase.
- Automated CI/CD Pipeline (GitHub Actions, SonarQube, Codecov, Vercel): Establishes a streamlined, production-ready deployment process, ensuring rapid, reliable, and high-quality releases.
- Live Demo Deployment (Vercel): Provides immediate access to a functional application, showcasing practical deployment skills.

<img src="./public/screenshots/sonarqube screenshot.png" alt="SonarQube Rating" width="470" height="145">

---

## 🛠️ Technical Decisions

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/) - modern UI with strong type safety
- **Build**: [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Lint Staged](https://github.com/okonet/lint-staged), [Husky](https://github.com/typicode/husky) - automated code quality checks and style formatting during commit, preventing problems into codebase and make consistent code style in team work
- **UI**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/) - for consistent, responsive, and scalable styling, enabling rapid and maintainable UI development
- **Testing**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) - easier to setup and faster execution than Jest and Cypress, chosen for their efficiency and comprehensive testing capabilities
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) - minimal and testable global state management, 40% code reduction compared to Redux
- **Forms**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) - composable form logic and schema validation. [Zod's built-in email validation](https://zod.dev/api#emails) was chosen for realistic coverage without regex complexity or code smell.
- **Websocket**: [Socket.io](https://socket.io/) - for intuitive WebSocket API and event abstraction, simplifying real-time communication implementation
- **CI/CD**: [GitHub Actions](https://github.com/features/actions), [Vercel](https://vercel.com/home), [Codecov](https://codecov.io/), [SonarQube](https://sonarcloud.io/) - Every pull request triggers a comprehensive pipeline, enforcing code quality gates and ensuring production-readiness through automated testing and deployment

---

## 🚀 Getting Started

### Requirements

- [Node.JS](https://nodejs.org/en/download/) v22.x, please use [NVM](https://github.com/nvm-sh/nvm) or [FNM](https://github.com/Schniz/fnm) to install
- [PNPM](https://pnpm.io/) (Recommended, you can use NPM or Yarn)

### Useful Commands

```bash
# Install dependencies
pnpm install

# Rename .env.example to .env
mv .env.example .env

# Modify .env file, replace [wss://xxx.com/ws] with your websocket url
VITE_WEBSOCKET_URL=[wss://xxx.com/ws]

# Start development server
pnpm dev

# Run unit and integration tests by Vitest
pnpm test

# Run E2E tests by Playwright
pnpm playwright

# ESLint fix
pnpm lint

# Format code
pnpm format

# Build
pnpm build
```

---

## 📖 Detailed Technical Documentation

### 📊 Testing Strategy

- Unit Tests: Focused on critical store logic, complex form validations, and isolated component behaviors, ensuring granular code reliability.
- Coverage: Maintained above 80% (verified via `vitest run --coverage`), reflecting a commitment to robust code coverage without sacrificing test quality.

<img src="./public/screenshots/test coverage.png" alt="Coverage" width="723" height="472">

- E2E Tests: Critical user flows, such as the Login modal, are validated end-to-end using Playwright, simulating real user interactions to guarantee system integrity.
- Cross-browser Testing Strategy: Ensures consistent functionality and user experience across a carefully selected range of desktop and mobile browsers based on market share, mitigating compatibility issues.

### Project Structure

```text
__tests__/
│   ├── e2e/ # End-to-end tests (by Playwright)
│   └── unit/ # Unit tests (by Vitest)
.github/ # GitHub Actions workflows
.husky/ # Husky configuration
src/
├── components/ # Reusable React components
│   └── ui/ # Shadcn UI components
├── constants/ # Application-wide constants
├── hooks/ # Custom React hooks
├── lib/
│   ├── utils.ts # tailwindcss utils
│   └── validators.ts # form validators
├── stores/ # Zustand stores
├── types/ # Type definitions
├── App.tsx # Root component
├── global.css # Global styles
└── main.tsx # Entry point
.env.example # Environment variables
```

### Known Issues & Limitations

#### Radix UI ARIA Warning:

- **Issue**: Blocked aria-hidden on a element warning in Dialog components
- **Impact**: Development warning only, no production impact
- **Solution**: Can be safely ignored as most modern browsers handle this correctly
- **Reason**: Internal implementation of Radix UI's Dialog component

### Future Improvements

#### Enhancing Form Submission UX (Disabled Save Button vs. Real-time Feedback)

- Current: "Save" button disabled until all fields are valid, per specification.
- Alternative UX: Enabling the "Save" button earlier, coupled with real-time, field-specific error messages, generally offers a more intuitive user experience. This allows users to proactively address issues without waiting for global validation, potentially improving form completion and user satisfaction. This was a deliberate choice to adhere strictly to the assignment's explicit requirement, while acknowledging a common UX best practice for future iterations.

#### Dark mode and theme switching

- Current: only light mode is supported
- Future: support dark mode and theme switching

#### Internationalization (i18n)

- Current: only Chinese is supported
- Future: support English and other languages
