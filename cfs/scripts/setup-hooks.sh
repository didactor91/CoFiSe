#!/bin/sh
# Git Hooks Setup for CFS Monorepo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}🔧 Setting up Git hooks for CFS...${NC}"

# Install Husky if not present
if [ ! -d "node_modules/husky" ]; then
  echo "${YELLOW}Installing Husky...${NC}"
  pnpm add -D husky
fi

# Initialize Husky
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'HOOK'
#!/bin/sh
# CFS Pre-commit Hook

# Branch name checks (prevent committing to main/master directly)
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
  echo "\033[0;31m✖ Cannot commit directly to $BRANCH_NAME branch\033[0m"
  echo "   Please create a feature branch and open a PR"
  exit 1
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to lint"
  exit 0
fi

echo "\033[0;32m✓ Running pre-commit checks...\033[0m"

# Check if lint-staged is available
if [ -f "node_modules/lint-staged/package.json" ]; then
  echo "\033[0;32m✓ Running lint-staged...\033[0m"
  npx lint-staged
else
  # Fallback: run ESLint and Prettier on staged files
  echo "\033[1;33m⚠ lint-staged not found, running basic checks...\033[0m"
  
  # ESLint check
  if command -v eslint &> /dev/null; then
    echo "Running ESLint..."
    npx eslint --max-warnings=0 $STAGED_FILES
  fi
  
  # Prettier check
  if command -v prettier &> /dev/null; then
    echo "Checking Prettier formatting..."
    npx prettier --check $STAGED_FILES
  fi
fi

echo "\033[0;32m✓ Pre-commit checks passed\033[0m"
HOOK

# Create pre-push hook
cat > .husky/pre-push << 'HOOK'
#!/bin/sh
# CFS Pre-push Hook

echo "\033[0;32m✓ Running pre-push checks...\033[0m"

# Get branch info
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)
REMOTE_NAME=$1
REMOTE_URL=$2

# Only run on main/master branches
if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
  echo "\033[1;33m⚠ About to push to $BRANCH_NAME\033[0m"
  
  # Run type check before push
  echo "Running TypeScript check..."
  pnpm --filter client run lint || { echo "\033[0;31m✖ Type check failed\033[0m"; exit 1; }
fi

echo "\033[0;32m✓ Pre-push checks passed\033[0m"
HOOK

# Create commit-msg hook for conventional commits
cat > .husky/commit-msg << 'HOOK'
#!/bin/sh
# CFS Commit-msg Hook - validates conventional commits

COMMIT_MSG=$(cat "$1")
COMMIT_MSG_LENGTH=${#COMMIT_MSG}

# Skip if empty
if [ $COMMIT_MSG_LENGTH -eq 0 ]; then
  exit 0
fi

# Conventional commits format: type(scope): subject
# Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
CONVENTIONAL_REGEX="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,}"

if ! echo "$COMMIT_MSG" | grep -qE "$CONVENTIONAL_REGEX"; then
  echo "\033[0;31m✖ Invalid commit message format\033[0m"
  echo ""
  echo "Expected format: type(scope): description"
  echo ""
  echo "Valid types:"
  echo "  feat    - New feature"
  echo "  fix     - Bug fix"
  echo "  docs    - Documentation"
  echo "  style   - Formatting, no code change"
  echo "  refactor- Refactoring"
  echo "  test    - Adding tests"
  echo "  chore   - Maintenance"
  echo "  perf    - Performance"
  echo "  ci      - CI changes"
  echo "  build   - Build system"
  echo "  revert  - Revert commit"
  echo ""
  echo "Example: feat(auth): add JWT refresh token support"
  echo ""
  echo "Your commit: $COMMIT_MSG"
  exit 1
fi

echo "\033[0;32m✓ Commit message validated\033[0m"
HOOK

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/commit-msg

echo ""
echo "\033[0;32m✓ Git hooks installed successfully!\033[0m"
echo ""
echo "Available hooks:"
echo "  • pre-commit   - Lint-staged, ESLint, Prettier"
echo "  • commit-msg   - Conventional commits validation"
echo "  • pre-push     - TypeScript checks before push"
echo ""
echo "\033[1;33mNote: Branch protection enabled - cannot commit directly to main/master\033[0m"