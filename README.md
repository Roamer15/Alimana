# Store Microservice

A backend microservice built with [NestJS](https://nestjs.com/) and TypeScript.

## Features

- **NestJS**: Scalable Node.js framework for building efficient server-side applications.
- **TypeScript**: Strongly typed language for safer, more maintainable code.
- **Prettier & ESLint**: Enforced code style and quality.
- **Jest**: Unit and e2e testing.
- **Husky & lint-staged**: Pre-commit hooks for code quality.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

```bash
git clone <repository-url>
cd store-ms
npm install
```

### Running the App

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

### Code Quality

```bash
# Lint and fix
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

## Project Structure

```
src/        # Application source code
test/       # Test files
dist/       # Compiled output (ignored in git)
```

## Contributing

1. Fork the repository
2. Switch to the development branch
3. Create your feature branch (`git checkout -b feature/your-feature`)
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a pull request

## License

MIT
