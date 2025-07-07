# User List SPA (websocket template)

[![codecov](https://codecov.io/gh/john-data-chen/websocket-template/graph/badge.svg?token=FoJ3e75P37)](https://codecov.io/gh/john-data-chen/websocket-template)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=john-data-chen_websocket-template&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=john-data-chen_websocket-template)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![CI](https://github.com/john-data-chen/websocket-template/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/john-data-chen/websocket-template/actions/workflows/CI.yml)

## Summary

This is a demo project for a user list SPA using websocket.

**Extra Accomplishments**:

- **Responsive Design**: for both desktop and mobile devices, using Tailwind CSS.
- **Test Coverage**: 80%+
- **Reliability, Security and Maintainability Rating in SonarQube**: A
- **Cross-browser Testing**: for both desktop and mobile devices.
- **CI/CD automation**: in GitHub actions and Vercel.

---

## 🛠️ Technical Stack

- **Requirements**: [Node.JS](https://nodejs.org/en/download/) v22.x
- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Build**: [PNPM](https://pnpm.io/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Lint Staged](https://github.com/okonet/lint-staged), [Husky](https://github.com/typicode/husky)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI**: [Shadcn/UI](https://ui.shadcn.com/)
- **Testing**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions), [Vercel](https://vercel.com/home), [Codecov](https://codecov.io/), [SonarQube](https://sonarcloud.io/)

---

## 🚀 Getting Started

### Useful Commands

```bash
# Install dependencies
pnpm install

# Rename .env.example to .env
mv .env.example .env

# modify .env file, replace [wss://xxx.com/ws] with your websocket url
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

- Cross-browser testing (by Playwright) ensures functionality across desktop and mobile.

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
README.md # Project documentation
```
