#!/bin/bash
set -euo pipefail

# VendFinder Version Manager
# Handles semantic versioning and release management

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[VERSION] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[VERSION] $1${NC}"
}

error() {
    echo -e "${RED}[VERSION] $1${NC}"
    exit 1
}

usage() {
    cat << EOF
Version Manager for VendFinder

COMMANDS:
    current         Show current version
    next [type]     Show next version (patch, minor, major)
    bump [type]     Create new version tag (patch, minor, major)
    list            List recent versions
    validate        Validate current version format

OPTIONS:
    --dry-run       Show what would be done without making changes
    --force         Force operation without confirmation

EXAMPLES:
    $0 current                  # Show current version
    $0 next minor               # Show what next minor version would be
    $0 bump patch               # Create new patch version tag
    $0 list                     # Show last 10 versions

EOF
}

get_current_version() {
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        error "Not in a git repository"
    fi

    # Try to get version from current commit
    if git describe --tags --exact-match HEAD 2>/dev/null; then
        # Current commit has a tag
        git describe --tags --exact-match HEAD
    else
        # Get latest tag
        local latest_tag
        latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
        if [ -z "$latest_tag" ]; then
            echo "v0.0.0"
        else
            echo "$latest_tag"
        fi
    fi
}

get_next_version() {
    local bump_type=$1
    local current_version
    current_version=$(get_current_version)

    # Remove 'v' prefix if present
    current_version=${current_version#v}

    # Split version into parts
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]:-0}
    local minor=${VERSION_PARTS[1]:-0}
    local patch=${VERSION_PARTS[2]:-0}

    # Remove any non-numeric characters from patch (in case of pre-release versions)
    patch=$(echo "$patch" | sed 's/[^0-9].*//')

    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            error "Invalid bump type: $bump_type. Use: major, minor, patch"
            ;;
    esac

    echo "v$major.$minor.$patch"
}

validate_version() {
    local version=$1

    # Enhanced semver validation to match production workflow
    if [[ ! $version =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
        error "Invalid version format: $version. Expected semver format: v1.2.3, v1.2.3-alpha.1, v1.2.3+build.1"
    fi
}

check_git_status() {
    if [ "${FORCE:-}" != "true" ] && [ -n "$(git status --porcelain)" ]; then
        error "Working directory is not clean. Commit changes or use --force"
    fi

    if [ "${FORCE:-}" != "true" ] && [ "$(git branch --show-current)" != "main" ]; then
        warn "Not on main branch. Current branch: $(git branch --show-current)"
        read -p "Continue anyway? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Aborted by user"
        fi
    fi
}

create_version_tag() {
    local bump_type=$1
    local new_version
    new_version=$(get_next_version "$bump_type")

    log "Creating new $bump_type version: $new_version"

    if [ "${DRY_RUN:-}" = "true" ]; then
        log "DRY RUN: Would create tag $new_version"
        log "DRY RUN: Current HEAD: $(git rev-parse HEAD)"
        log "DRY RUN: Would push tag to origin"
        return 0
    fi

    check_git_status

    # Validate the new version format
    validate_version "$new_version"

    # Check if tag already exists
    if git rev-parse "$new_version" >/dev/null 2>&1; then
        error "Tag $new_version already exists"
    fi

    # Create annotated tag
    git tag -a "$new_version" -m "Release $new_version

Created by version-manager.sh on $(date)
Type: $bump_type release
Commit: $(git rev-parse HEAD)"

    log "Created tag: $new_version"

    # Ask about pushing
    if [ "${FORCE:-}" != "true" ]; then
        read -p "Push tag to origin? (Y/n): " -r
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            if git push origin "$new_version"; then
                log "Tag pushed to origin"
            else
                warn "Failed to push tag to origin"
            fi
        fi
    else
        # Force mode - push automatically
        if git push origin "$new_version"; then
            log "Tag pushed to origin"
        else
            warn "Failed to push tag to origin"
        fi
    fi
}

list_versions() {
    log "Recent versions:"

    # Check if any tags exist
    if ! git tag -l "v*" | head -1 >/dev/null 2>&1; then
        warn "No version tags found"
        return 0
    fi

    # List recent versions with additional info
    git tag -l "v*" --sort=-version:refname | head -10 | while read -r tag; do
        if [ -n "$tag" ]; then
            local commit_date
            commit_date=$(git log -1 --format="%ci" "$tag" 2>/dev/null | cut -d' ' -f1)
            local commit_hash
            commit_hash=$(git rev-list -n 1 "$tag" 2>/dev/null | cut -c1-8)
            printf "  %-12s %s %s\n" "$tag" "$commit_date" "$commit_hash"
        fi
    done
}

show_current() {
    local current
    current=$(get_current_version)
    log "Current version: $current"

    # Show commit info if not on a tag
    if ! git describe --tags --exact-match HEAD >/dev/null 2>&1; then
        local latest_tag
        latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
        local commits_ahead

        if [ "$latest_tag" != "none" ]; then
            commits_ahead=$(git rev-list --count "$latest_tag..HEAD" 2>/dev/null || echo "unknown")
            log "Latest tag: $latest_tag"
            log "Commits ahead: $commits_ahead"
            log "Current commit: $(git rev-parse --short HEAD)"
        else
            log "No previous tags found"
            log "Current commit: $(git rev-parse --short HEAD)"
        fi
    else
        log "Current commit is tagged with: $current"
    fi
}

show_next() {
    local bump_type=${1:-patch}
    local next_version
    next_version=$(get_next_version "$bump_type")
    log "Next $bump_type version: $next_version"

    # Show what commits would be included
    local current_version
    current_version=$(get_current_version)

    if [ "$current_version" != "v0.0.0" ] && git rev-parse "$current_version" >/dev/null 2>&1; then
        local commits_since
        commits_since=$(git rev-list --count "$current_version..HEAD" 2>/dev/null || echo "0")
        log "Commits since $current_version: $commits_since"

        if [ "$commits_since" -gt "0" ]; then
            log "Recent commits:"
            git log --oneline "$current_version..HEAD" | head -5 | sed 's/^/  /'
            if [ "$commits_since" -gt "5" ]; then
                log "  ... and $((commits_since - 5)) more"
            fi
        fi
    fi
}

validate_current() {
    local current
    current=$(get_current_version)
    validate_version "$current"
    log "Version $current is valid"
}

main() {
    local command=""
    local bump_type=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            current|list|validate)
                command=$1
                shift
                ;;
            next|bump)
                command=$1
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            major|minor|patch)
                bump_type=$1
                shift
                ;;
            *)
                error "Unknown option: $1. Use -h for help."
                ;;
        esac
    done

    if [ -z "$command" ]; then
        usage
        exit 1
    fi

    case $command in
        current)
            show_current
            ;;
        next)
            show_next "${bump_type:-patch}"
            ;;
        bump)
            if [ -z "$bump_type" ]; then
                error "Bump type required: major, minor, patch"
            fi
            create_version_tag "$bump_type"
            ;;
        list)
            list_versions
            ;;
        validate)
            validate_current
            ;;
    esac
}

main "$@"