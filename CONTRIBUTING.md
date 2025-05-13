# Contributing to Chopr

Thank you for your interest in contributing to Chopr! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be kind and constructive in your interactions with others.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**: `npm install`
4. **Start the development server**: `npm run dev`

## Development Workflow

1. **Create a branch** for your feature or fix: `git checkout -b feature/your-feature-name`
2. **Make your changes** and ensure they work as expected
3. **Commit your changes** with a descriptive commit message
4. **Push to your fork** and submit a pull request

## Project Structure

The project follows a standard React and Electron structure:

```
chopr/
├── public/                # Static assets
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Main application pages/screens
│   ├── parsers/           # Log format parsers
│   │   └── RegexPatterns.ts # Core file with all regex patterns for log parsing
│   └── i18n/              # Internationalization
├── build/                 # Compiled output
└── tools/                 # Build and development tools
```

## Key Files

### RegexPatterns.ts

The `src/parsers/RegexPatterns.ts` file is a critical component of the application. It contains all the regular expressions used to identify and parse different log formats. When adding support for new log formats or improving existing ones:

1. Add your regex patterns to the appropriate format category
2. Test your patterns with various log samples
3. Include named capture groups for structured data extraction
4. Document the pattern with comments if it's complex

## Coding Standards

### General Guidelines

- Use TypeScript for type safety
- Follow the existing code style and formatting
- Keep components focused on a single responsibility
- Use functional components with hooks instead of class components

### TypeScript

- Prefer explicit types over implicit types
- Use interfaces for object types
- Use type guards to narrow types when necessary

### Testing

- Try to write tests for all new functionality
- Ensure existing tests pass before submitting a PR
- Use descriptive test names that explain the expected behavior

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if necessary
3. Add or update tests for your changes
4. Ensure all tests pass
5. Submit a pull request with a clear description of the changes

## Release Process

Chopr follows semantic versioning:

- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality additions
- **PATCH** version for backward-compatible bug fixes

## Getting Help

If you need help with contributing:

- Open an issue with your question
- Reach out to the maintainers

---

Thank you for contributing to Chopr!
