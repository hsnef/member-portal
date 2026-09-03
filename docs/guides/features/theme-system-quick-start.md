# Theme System - Quick Start Guide

## Understanding Git Commits & Deployment Flow

### What is a Commit?

A **commit** is like saving a snapshot of your code at a point in time. Think of it like:

```
📸 Commit = Photo of your code at this moment
```

When you commit:
- ✅ Your changes are **saved locally** in your Git repository
- ✅ You get a commit message describing what changed
- ✅ You can see the history of all commits
- ❌ Changes are **NOT** visible on the server yet (they're only on your computer)

### The Flow: Local → Remote → Server

```
Your Computer (Local)
    ↓ git commit
    ↓ git push
GitHub (Remote Repository)
    ↓ (Vercel watches for changes)
    ↓ Auto-deploys
Vercel Server (Production/Dev)
    ↓
Your Website (live URL)
```

## Current Situation

### Where is the Theme System Code?

**Right Now:**
- ✅ Code files are created in your workspace (`lib/themes/`, `app/api/themes/`, etc.)
- ✅ You're on branch: `feature/theme-system`
- ❌ Changes are **NOT committed** yet (they're "untracked" or "modified")
- ❌ Changes are **NOT on GitHub** yet
- ❌ Changes are **NOT on server** yet

### Check Current Status

```bash
# See what files have changed
git status

# See the changes you made
git diff
```

---

## Step-by-Step: Commit & Deploy

### Step 1: Stage Files (Tell Git What to Commit)

```bash
# Stage only theme-related files
git add lib/themes/
git add app/admin/settings/appearance/
git add app/api/themes/
git add supabase/migrations/20260112000001_theme_system.sql
git add app/layout.tsx app/globals.css tailwind.config.ts
git add app/admin/settings/page.tsx

# Verify what you're about to commit
git status
```

**What this does:**
- Marks these files as "ready to commit"
- They're in "staging area" (like items in a shopping cart)
- Nothing is saved yet

### Step 2: Commit (Save Locally)

```bash
git commit -m "feat: Add theme system with visual builder and Florida Oura theme"
```

**What this does:**
- ✅ Saves a snapshot of your code **on your computer**
- ✅ Creates a commit with your message
- ✅ You can see this commit in `git log`
- ❌ Still **NOT on GitHub** or server

**After commit:**
- Code is safe on your computer
- You can undo if needed (`git reset`)
- Other people can't see it yet

### Step 3: Push to GitHub (Upload to Remote)

```bash
# Push your feature branch to GitHub
git push -u origin feature/theme-system
```

**What this does:**
- ✅ Uploads your commits to **GitHub**
- ✅ Others can see your branch
- ✅ Vercel can see the branch
- ✅ **Deployed.** Both `dev.member.hsnef.org` and `member.hsnef.org` are live (production came up 2026-09-02).

**After push:**
- Code is on GitHub (backup, visible to team)
- Vercel might create a preview deployment (if configured)

### Step 4: Deploy to Server

#### Option A: Automatic (If Vercel is Configured)

If your Vercel project watches the `feature/theme-system` branch:
1. Vercel automatically detects the push
2. Builds your code
3. Creates a preview URL like: `https://member-portal-abc123.vercel.app`
4. You can test there

#### Option B: Manual Deployment

1. **Test Locally First:**
   ```bash
   # Make sure your dev server is running
   npm run dev
   # Test at: http://localhost:3000/admin/settings/appearance
   ```

2. **Merge to Dev Branch:**
   ```bash
   # Switch to dev branch
   git checkout dev
   
   # Merge your feature branch
   git merge feature/theme-system
   
   # Push to GitHub
   git push origin dev
   ```

3. **Vercel Auto-Deploys:**
   - Vercel watches `dev` branch
   - Automatically deploys to: `https://dev-portal.vercel.app` (or your dev URL)

4. **Deploy to Production (Later):**
   ```bash
   # Switch to main branch
   git checkout main
   
   # Merge dev into main
   git merge dev
   
   # Push to GitHub
   git push origin main
   ```
   - Vercel deploys to: `https://member.hsnef.org` (production)

---

## Testing Strategy

### Local Testing (Before Commit)

**Best Practice:** Test locally first!

```bash
# 1. Make sure database migration is applied
# Go to Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20260112000001_theme_system.sql

# 2. Start dev server
npm run dev

# 3. Test at: http://localhost:3000/admin/settings/appearance
```

**Benefits:**
- Fast feedback
- No need to wait for deployment
- Can fix issues before committing

### Feature Branch Testing (After Push)

```bash
# 1. Push feature branch
git push -u origin feature/theme-system

# 2. If Vercel creates preview URL, test there
# URL will be in Vercel dashboard or GitHub PR
```

**Benefits:**
- Test in production-like environment
- Share with team for review
- Test before merging to dev

### Dev Server Testing (After Merge to Dev)

- Code is on `dev` branch
- Vercel deploys to dev URL
- Test with real data

### Production Testing (After Merge to Main)

- Code is on `main` branch  
- Vercel deploys to production URL
- **All users see the changes**

---

## Where Will Code Be Available?

### Scenario 1: Only Committed Locally

```
Your Computer ✅ → GitHub ❌ → Server ❌
```
- Only you can see it
- Lost if computer crashes
- Not backed up

### Scenario 2: Pushed to GitHub

```
Your Computer ✅ → GitHub ✅ → Server ❌ (unless Vercel auto-deploys feature branch)
```
- Safe backup on GitHub
- Team can see branch
- Might have preview URL

### Scenario 3: Merged to Dev Branch

```
Your Computer ✅ → GitHub ✅ → Dev Server ✅ (https://dev-portal.vercel.app)
```
- Available on dev environment
- Safe to test
- Production unaffected

### Scenario 4: Merged to Main Branch

```
Your Computer ✅ → GitHub ✅ → Production Server ✅ (https://member.hsnef.org)
```
- **Live for all users**
- Be careful!

---

## Recommended Workflow

### For Testing Theme System Now:

```bash
# 1. Apply database migration first!
# Supabase Dashboard → SQL Editor → Run migration file

# 2. Test locally (recommended)
npm run dev
# Visit: http://localhost:3000/admin/settings/appearance

# 3. If it works, commit and push
git add [theme files]
git commit -m "feat: Add theme system"
git push -u origin feature/theme-system

# 4. Wait for Vercel preview (if configured), or merge to dev
git checkout dev
git merge feature/theme-system
git push origin dev
# Test at dev URL

# 5. When ready, merge to main for production
git checkout main
git merge dev
git push origin main
# Deploys to production
```

---

## Important Notes

### Database Migration Must Run First!

⚠️ **Before testing the theme system, you MUST run the database migration:**

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open file: `supabase/migrations/20260112000001_theme_system.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run"
7. Verify success

**Without this migration:**
- Theme system won't work
- API routes will fail
- Database tables don't exist

### Branch Safety

- `feature/theme-system` = Safe playground (won't affect production)
- `dev` = Development server (safe to test)
- `main` = Production (be careful!)

---

## Quick Reference Commands

```bash
# Check current status
git status

# Stage files
git add <file-or-directory>

# Commit locally
git commit -m "Your message here"

# Push to GitHub
git push -u origin feature/theme-system

# Switch branches
git checkout dev

# Merge feature into dev
git merge feature/theme-system

# See commit history
git log --oneline

# Undo last commit (if needed, BEFORE pushing)
git reset HEAD~1
```

---

## Next Steps

1. **Apply database migration** (Supabase Dashboard)
2. **Test locally** (npm run dev)
3. **Commit if working** (git commit)
4. **Push to GitHub** (git push)
5. **Test on preview/dev server**
6. **Merge to dev** when satisfied
7. **Merge to main** for production
