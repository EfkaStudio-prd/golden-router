# Contributing to Golden Router v2.0

Thank you for your interest in contributing to Golden Router v2.0! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, etc.)
- Screenshots or logs if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the enhancement
- Explain why this enhancement would be useful
- Provide examples of how the enhancement would be used

### Pull Requests

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/golden-router.git
cd golden-router

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Coding Standards

- Follow existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features
- Update documentation as needed

### Commit Messages

Use clear and descriptive commit messages:

```
feat: add new provider support
fix: resolve quota tracking bug
docs: update API documentation
test: add unit tests for combo handler
```

## Project Structure

```
golden-router/
├── src/
│   ├── api/                    # API endpoints
│   ├── core/                   # Core business logic
│   │   ├── combo/             # Combo fallback logic
│   │   ├── quota/             # Quota tracking
│   │   ├── oauth/             # OAuth management
│   │   ├── providers/         # Provider executor
│   │   ├── routing/           # Routing engine
│   │   └── translation/       # Format translation
│   └── lib/                   # Core libraries
│       ├── localDb.js         # Local persistence
│       ├── usageDb.js         # Usage tracking
│       ├── cloudSync.js       # Cloud sync
│       └── dataMigration.js   # Data migration
├── public/                     # Static files
│   └── dashboard.html         # Dashboard UI
├── server.js                   # Main server
└── package.json
```

## Adding New Providers

To add a new provider:

1. Add provider configuration in `src/core/providers/providerExecutor.js`
2. Add format translators in `src/core/translation/translator/`
3. Add pricing information in quota tracker
4. Update documentation
5. Add tests

## Adding New Formats

To add a new format:

1. Create request translator in `src/core/translation/translator/request/`
2. Create response translator in `src/core/translation/translator/response/`
3. Register format in `src/core/translation/translator/index.js`
4. Add tests
5. Update documentation

## Testing

Run tests before submitting:

```bash
# Run routing engine tests
node test-routing.js

# Run API tests
powershell -ExecutionPolicy Bypass -File test-api-simple.ps1
```

## Documentation

Keep documentation up to date:
- Update README.md for user-facing changes
- Update API documentation for new endpoints
- Add comments for complex code
- Update this CONTRIBUTING.md for process changes

## Questions?

Feel free to open an issue for questions or discussions about contributions.

---

Thank you for contributing to Golden Router v2.0! 🥇
