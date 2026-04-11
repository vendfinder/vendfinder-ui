#!/bin/bash

# VendFinder CI/CD - Commit Setup Script
# This script configures conventional commits, husky hooks, and commit linting

set -e

echo "🚀 Setting up VendFinder Conventional Commits..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking dependencies...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

# Install/update dependencies
echo -e "${BLUE}📦 Installing/updating dependencies...${NC}"
npm install --save-dev @commitlint/cli@^19.0.0 @commitlint/config-conventional@^19.0.0 husky@^9.0.0

# Initialize husky if not already done
echo -e "${BLUE}🪝 Setting up Git hooks...${NC}"
if [ ! -d ".husky" ]; then
    npm run prepare
fi

# Create commit-msg hook
echo -e "${BLUE}📝 Creating commit-msg hook...${NC}"
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running commit message validation..."
npx --no -- commitlint --edit $1
EOF

# Create pre-commit hook with bypass option
echo -e "${BLUE}🛡️ Creating pre-commit hook...${NC}"
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint
echo "📋 Running ESLint..."
npm run lint

# Security scan with bypass option
if [ "$SKIP_SECURITY_SCAN" = "true" ]; then
    echo "⚠️ Security scan bypassed via SKIP_SECURITY_SCAN=true"
else
    echo "🔒 Running security scan..."
    # Note: Security scan integration will be added when Opsera is available
    echo "ℹ️ Security scan placeholder - will be enabled when Opsera integration is configured"
fi
EOF

# Make hooks executable
chmod +x .husky/commit-msg
chmod +x .husky/pre-commit

# Verify commitlint config exists
if [ ! -f ".commitlintrc.json" ]; then
    echo -e "${YELLOW}⚠️ Warning: .commitlintrc.json not found, creating default...${NC}"
    cat > .commitlintrc.json << 'EOF'
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]],
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72]
  }
}
EOF
fi

# Test commitlint
echo -e "${BLUE}🧪 Testing commitlint configuration...${NC}"
echo "feat: test commit message" | npx commitlint

# Create example commit script
echo -e "${BLUE}📄 Creating example commit helper...${NC}"
cat > scripts/example-commits.sh << 'EOF'
#!/bin/bash

echo "🎯 VendFinder Conventional Commit Examples:"
echo ""
echo "✅ Good examples:"
echo "  feat(auth): add OAuth2 login integration"
echo "  fix(cart): resolve checkout payment processing error"
echo "  docs(api): update authentication endpoint documentation"
echo "  style(ui): improve button hover animations"
echo "  refactor(utils): extract common validation functions"
echo "  perf(search): optimize product query performance"
echo "  test(auth): add unit tests for login service"
echo "  build(docker): update Node.js version to 18.19"
echo "  ci(github): add automated deployment workflow"
echo "  chore(deps): update dependencies to latest versions"
echo ""
echo "❌ Bad examples:"
echo "  Fix bug (missing type)"
echo "  feat: Add new feature. (ends with period)"
echo "  FEAT: add feature (wrong case)"
echo "  fix(Cart): resolve bug (scope should be lowercase)"
echo ""
echo "💡 Tips:"
echo "  - Use 'npm run commit' for interactive commit creation"
echo "  - Keep subject line under 72 characters"
echo "  - Use imperative mood (add, fix, update, not added, fixed, updated)"
echo "  - Reference issues: 'fix(auth): resolve login issue (#123)'"
EOF

chmod +x scripts/example-commits.sh

# Add commit script to package.json if not exists
if ! grep -q '"commit"' package.json; then
    echo -e "${BLUE}📦 Adding commit script to package.json...${NC}"
    npm pkg set scripts.commit="git-cz"
fi

# Final verification
echo -e "${BLUE}✅ Running final verification...${NC}"

# Check if husky is properly installed
if [ -d ".husky" ] && [ -f ".husky/commit-msg" ]; then
    echo -e "${GREEN}✅ Husky hooks installed successfully${NC}"
else
    echo -e "${RED}❌ Husky hooks installation failed${NC}"
    exit 1
fi

# Check if commitlint works
if npx commitlint --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Commitlint installed successfully${NC}"
else
    echo -e "${RED}❌ Commitlint installation failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 VendFinder Conventional Commits setup complete!${NC}"
echo ""
echo -e "${BLUE}📚 Next steps:${NC}"
echo "  1. Run 'npm run commit' for interactive commits"
echo "  2. Use './scripts/example-commits.sh' to see commit examples"
echo "  3. All commits will now be validated automatically"
echo "  4. Use 'git commit --no-verify' to bypass hooks if needed"
echo ""
echo -e "${YELLOW}💡 Pro tips:${NC}"
echo "  - Use semantic commit types (feat, fix, docs, etc.)"
echo "  - Keep commit messages concise and descriptive"
echo "  - Use scopes to indicate affected areas (auth, cart, ui, etc.)"
echo "  - Set SKIP_SECURITY_SCAN=true to bypass security checks temporarily"
echo ""