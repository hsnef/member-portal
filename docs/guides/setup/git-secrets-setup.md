# Git-Secrets Setup Guide

## What is git-secrets?

git-secrets is a tool that prevents you from committing passwords, API keys, and other secrets to git repositories. It scans your commits, commit messages, and `--no-ff` merges to prevent adding secrets.

## Installation

### Windows (Your System)

**Option 1: PowerShell (Recommended)**

1. Open **PowerShell as Administrator**
2. Run these commands:

```powershell
# Clone git-secrets
git clone https://github.com/awslabs/git-secrets.git C:\temp\git-secrets

# Navigate to the directory
cd C:\temp\git-secrets

# Run the installation script
.\install.ps1

# Restart your terminal/PowerShell to refresh PATH
```

**Option 2: Manual Installation via Git Bash**

```bash
# Clone the repository
git clone https://github.com/awslabs/git-secrets.git /tmp/git-secrets

# Copy to a directory in your PATH
cd /tmp/git-secrets
cp git-secrets /usr/local/bin/git-secrets
chmod +x /usr/local/bin/git-secrets
```

### Verify Installation

After installation, restart your terminal and run:

```bash
git secrets --help
```

If you see help output, it's installed correctly!

## Machine-wide vs Per-Repository

### ✅ Machine-wide (Global)
- The `git-secrets` binary/command is installed **once** on your machine
- Available from any directory after installation
- No need to reinstall for each project

### ⚠️ Per-Repository (Local)
- Git hooks must be installed **in each repository**
- Different repos can have different secret patterns
- Each repo needs its own configuration

**Think of it like:**
- Installing git-secrets = Installing Microsoft Word on your computer (once)
- Configuring hooks = Creating a new document in each project folder (per-project)

## Setup for This Repository

After installing git-secrets globally, configure it for the member-portal:

### Quick Setup (Automated)

```bash
# Run the setup script
./setup-git-secrets.sh
```

### Manual Setup (If script fails)

```bash
# Install hooks for this repository
git secrets --install -f

# Add AWS patterns (prevents AWS keys)
git secrets --register-aws

# Add Supabase patterns
git secrets --add 'sb_secret_[A-Za-z0-9_-]{40,}'
git secrets --add 'sb_publishable_[A-Za-z0-9_-]{40,}'

# Add Stripe patterns
git secrets --add 'sk_live_[A-Za-z0-9]{24,}'
git secrets --add 'sk_test_[A-Za-z0-9]{24,}'
git secrets --add 'whsec_[A-Za-z0-9]{32,}'

# Add Resend patterns
git secrets --add 're_[A-Za-z0-9]{20,}'

# Allow placeholder text in .env.example files
git secrets --add --allowed 'your-.*-key'
git secrets --add --allowed 'your-.*-secret'
git secrets --add --allowed 'placeholder'
```

### Verify Setup

```bash
# List all patterns
git secrets --list

# Test with a known secret pattern
echo "STRIPE_KEY=sk_live_1234567890abcdefghijklmn" | git secrets --scan -
```

This should catch the fake Stripe key and prevent it!

## How It Works

Once configured, git-secrets automatically:

1. **Pre-commit hook**: Scans staged files before each commit
2. **Commit-msg hook**: Scans commit messages for secrets
3. **Pre-push hook**: Scans before pushing to remote

If a secret is detected:
- ❌ The commit/push is **blocked**
- 🚨 You see an error message showing what was detected
- ✅ Your secrets stay safe!

## Testing

### Test 1: Try to commit a fake secret

```bash
# Create a test file with a fake secret
echo "STRIPE_SECRET_KEY=sk_live_abcdefghijklmnop" > test-secret.txt

# Try to commit it
git add test-secret.txt
git commit -m "test: Adding secret (should be blocked)"
```

**Expected:** Commit should be **blocked** with an error message.

### Test 2: Scan existing files

```bash
# Scan all tracked files
git secrets --scan

# Scan a specific file
git secrets --scan .env.local
```

## Common Commands

```bash
# Install hooks in current repository
git secrets --install

# Force reinstall (overwrites existing hooks)
git secrets --install -f

# Register AWS patterns
git secrets --register-aws

# Add a custom pattern
git secrets --add 'my-secret-pattern'

# Add an allowed pattern (false positive)
git secrets --add --allowed 'safe-pattern'

# List all patterns
git secrets --list

# Scan all files
git secrets --scan

# Scan specific file
git secrets --scan path/to/file

# Remove git-secrets hooks
git secrets --install --remove
```

## Patterns Configured for This Project

### API Keys and Secrets
- ✅ AWS keys (via `--register-aws`)
- ✅ Supabase service role keys
- ✅ Stripe secret/publishable keys
- ✅ Stripe webhook secrets
- ✅ Resend API keys
- ✅ OpenRouter API keys

### Allowed Patterns (Won't trigger alerts)
- ✅ `your-*-key` (placeholder text in examples)
- ✅ `your-*-secret` (placeholder text)
- ✅ `example` and `placeholder` keywords

## Troubleshooting

### "git-secrets: command not found"

**Solution:**
- Restart your terminal/PowerShell after installation
- Verify PATH includes git-secrets directory
- Try reinstalling with admin privileges

### False Positives

If git-secrets blocks a legitimate string:

```bash
# Add it to allowed patterns
git secrets --add --allowed 'the-safe-pattern'
```

### Hooks Not Working

```bash
# Reinstall hooks
git secrets --install -f

# Verify hooks exist
ls -la .git/hooks/
```

You should see:
- `pre-commit`
- `commit-msg`
- `prepare-commit-msg`

## Alternative: Pre-commit Framework

If git-secrets doesn't work well on Windows, consider using the `pre-commit` framework:

```bash
# Install pre-commit (requires Python)
pip install pre-commit

# Create .pre-commit-config.yaml
# Then run
pre-commit install
```

## Global Configuration (All Future Repos)

To automatically enable git-secrets for all new repos:

```bash
# Set up a template directory
git secrets --install ~/.git-templates/git-secrets
git config --global init.templateDir ~/.git-templates/git-secrets

# Register AWS patterns globally
git secrets --register-aws --global
```

Now every new `git init` or `git clone` will have git-secrets enabled!

## Summary

| Feature | Installed Where | Frequency |
|---------|----------------|-----------|
| `git-secrets` binary | Machine-wide | Once |
| Git hooks | Per repository | Each repo |
| Secret patterns | Per repository | Each repo |

**Remember:**
- Install git-secrets **once** on your machine
- Configure hooks **in each repository** you want to protect
- Test regularly to ensure it's working
