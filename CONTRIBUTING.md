# Contributing to costume-line-chart

First off, thank you for considering contributing to costume-line-chart! It's people like you that make this library better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, inclusive, and considerate of others.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/mahdiiithg/costume-line-chart/issues) to avoid duplicates.

When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples** (code snippets, data samples)
- **Describe the behavior you observed and what you expected**
- **Include screenshots or recordings** if applicable
- **Specify your environment** (React version, browser, OS)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the build passes
5. Make sure your code follows the existing style

## Development Setup

### Prerequisites

- Node.js >= 16
- npm or yarn

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/costume-line-chart.git
cd costume-line-chart

# Install dependencies
yarn install

# Build the package
yarn build
```

### Project Structure

```
costume-line-chart/
├── src/
│   ├── index.js                    # Package exports
│   ├── CostumeLineChart.jsx        # Main chart component
│   ├── CostumeLineChartContext.jsx # Context for multi-chart sync
│   ├── utils/
│   │   └── graphBounds.js          # Y-axis calculation utilities
│   └── styles/
│       └── chart.css               # Default styles
├── types/
│   └── index.d.ts                  # TypeScript definitions
├── dist/                           # Built files (generated)
└── docs/                           # Documentation
```

### Development Workflow

1. Make your changes in the `src/` directory
2. Build the package: `yarn build`
3. Test your changes in a consuming application
4. Update types in `types/index.d.ts` if you changed the API
5. Update documentation if needed

### Code Style

- Use meaningful variable and function names
- Comment complex logic
- Follow existing patterns in the codebase
- Keep components focused and single-purpose

### Commit Messages

We follow conventional commits format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for test additions/changes
- `chore:` for maintenance tasks

Example: `feat: add export to image functionality`

## Testing Changes Locally

To test your changes in another project:

```bash
# In the package directory
yarn build
yarn link

# In your test project
yarn link costume-line-chart
```

Or use file-based installation:

```bash
# In your test project
yarn add file:../path/to/costume-line-chart
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainer:

- GitHub: [@mahdiiithg](https://github.com/mahdiiithg)
- LinkedIn: [Mahdi Tahavorgar](https://www.linkedin.com/in/mahdi-thg/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
