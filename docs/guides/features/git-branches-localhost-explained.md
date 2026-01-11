# Git Branches & Localhost: How It Works

## Key Concept: One Branch at a Time

**When you run `npm run dev`:**
- It shows code from **the branch you're currently on**
- You can **only see one branch** at a time on localhost:3000
- Git branches are **separate** - they don't automatically merge

---

## Understanding Your Current Situation

### What You Have:

```
Your Computer:
├── dev branch (has your regular work)
├── feature/theme-system branch (has theme system) ← YOU ARE HERE
└── main branch (production code)
```

### What `npm run dev` Shows:

```
Current Branch: feature/theme-system
   ↓
npm run dev
   ↓
localhost:3000 shows: theme system code (feature/theme-system)
```

**Important:** You're **NOT** seeing dev branch code right now because you're on `feature/theme-system` branch.

---

## How to Switch Branches

### To See Dev Branch Code on localhost:3000:

```bash
# 1. Switch to dev branch
git checkout dev

# 2. Now localhost:3000 shows dev branch code
npm run dev
# Visit: http://localhost:3000 (shows dev branch, NO theme system)
```

### To See Theme System Code on localhost:3000:

```bash
# 1. Switch to feature branch
git checkout feature/theme-system

# 2. Now localhost:3000 shows theme system code
npm run dev
# Visit: http://localhost:3000 (shows theme system, includes dev code if merged)
```

---

## Common Scenarios

### Scenario 1: You Want to Work on Dev Branch

```bash
# Switch to dev branch
git checkout dev

# Work on dev branch
npm run dev
# localhost:3000 = dev branch code only

# Make changes, commit
git add .
git commit -m "Your changes"
git push origin dev
```

### Scenario 2: You Want to Test Theme System

```bash
# Switch to feature branch
git checkout feature/theme-system

# Test theme system
npm run dev
# localhost:3000 = theme system code

# Make changes, commit
git add .
git commit -m "Theme system changes"
git push -u origin feature/theme-system
```

### Scenario 3: You Want Both (Dev + Theme System)

**Option A: Merge feature branch into dev (recommended)**

```bash
# 1. Make sure feature branch is committed
git checkout feature/theme-system
git add .
git commit -m "Theme system"
git push -u origin feature/theme-system

# 2. Switch to dev and merge
git checkout dev
git merge feature/theme-system

# 3. Now dev branch has both
npm run dev
# localhost:3000 = dev branch with theme system
```

**Option B: Keep them separate (for testing)**

```bash
# Work on feature branch
git checkout feature/theme-system
npm run dev
# Test theme system

# Switch back to dev
git checkout dev
npm run dev
# Test dev branch without theme system
```

---

## How to Ensure Only Dev Branch Changes Are Visible

### If You're on Feature Branch (Current):

```bash
# 1. Check current branch
git branch --show-current
# Shows: feature/theme-system

# 2. Switch to dev branch
git checkout dev

# 3. Verify you're on dev
git branch --show-current
# Shows: dev

# 4. Now localhost:3000 shows ONLY dev branch code
npm run dev
# Visit: http://localhost:3000
```

### What Happens When You Switch Branches:

```bash
git checkout dev
```

**Git does this:**
1. Saves uncommitted changes (if any) or asks you to commit
2. Replaces files in your working directory with dev branch files
3. Removes feature/theme-system files (they're still in Git, just not visible)
4. You now see ONLY dev branch code

---

## Important Notes

### Uncommitted Changes

**If you have uncommitted changes when switching branches:**

```bash
# Git will warn you:
# error: Your local changes would be overwritten...

# Options:

# 1. Commit your changes first (recommended)
git add .
git commit -m "Save my work"
git checkout dev

# 2. Stash changes (temporary save)
git stash
git checkout dev
# Later, get changes back:
git checkout feature/theme-system
git stash pop

# 3. Discard changes (DANGER - lose work!)
git checkout -- .
git checkout dev
```

---

## Testing Workflow Recommendations

### For Your Current Situation:

**You have:**
- ✅ Dev branch with regular work
- ✅ Feature branch with theme system
- ✅ Want to test theme system

**Recommended Approach:**

```bash
# 1. Make sure you're on feature branch
git checkout feature/theme-system

# 2. Apply database migration (required!)
# Go to Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20260112000001_theme_system.sql

# 3. Test theme system locally
npm run dev
# Visit: http://localhost:3000/admin/settings/appearance
# Test theme switching, builder, etc.

# 4. When satisfied, commit theme system
git add lib/themes/ app/api/themes/ app/admin/settings/appearance/
git add supabase/migrations/20260112000001_theme_system.sql
git add app/layout.tsx app/globals.css tailwind.config.ts
git commit -m "feat: Add theme system with visual builder"

# 5. Push feature branch
git push -u origin feature/theme-system

# 6. Merge to dev when ready
git checkout dev
git merge feature/theme-system
git push origin dev
# Now dev branch has theme system
# localhost:3000 on dev branch = both regular work + theme system
```

---

## Quick Reference Commands

```bash
# Check current branch
git branch --show-current

# Switch to dev branch
git checkout dev

# Switch to feature branch
git checkout feature/theme-system

# See what branch you're on
git branch
# * shows current branch

# See differences between branches
git diff dev..feature/theme-system

# See what's changed in current branch
git status

# See commit history
git log --oneline -10
```

---

## Summary

**Q: Are changes from dev and feature branches both visible on localhost:3000?**

**A: NO.** localhost:3000 shows **only the branch you're currently on**.

- On `feature/theme-system` → localhost:3000 = theme system code
- On `dev` → localhost:3000 = dev branch code

**Q: How to ensure only dev branch changes are visible?**

**A: Switch to dev branch:**

```bash
git checkout dev
npm run dev
# Now localhost:3000 = dev branch only
```

**Q: Can I see both at once?**

**A: No, but you can merge them:**

```bash
git checkout dev
git merge feature/theme-system
# Now dev branch has both
npm run dev
# localhost:3000 = dev + theme system
```
