#!/bin/bash
# Setup git-secrets for HSNEF Member Portal

echo "Installing git-secrets hooks for this repository..."
git secrets --install -f

echo "Adding AWS patterns (prevents AWS keys)..."
git secrets --register-aws

echo "Adding custom patterns for this project..."

# Supabase
git secrets --add 'sb_secret_[A-Za-z0-9_-]{40,}'
git secrets --add 'sb_publishable_[A-Za-z0-9_-]{40,}'
git secrets --add '[A-Za-z0-9]{20}\.supabase\.co'

# Stripe
git secrets --add 'sk_live_[A-Za-z0-9]{24,}'
git secrets --add 'sk_test_[A-Za-z0-9]{24,}'
git secrets --add 'pk_live_[A-Za-z0-9]{24,}'
git secrets --add 'pk_test_[A-Za-z0-9]{24,}'
git secrets --add 'whsec_[A-Za-z0-9]{32,}'

# Resend
git secrets --add 're_[A-Za-z0-9]{20,}'

# OpenRouter
git secrets --add 'sk-or-v1-[A-Za-z0-9]{64,}'

# Generic patterns
git secrets --add --allowed 'your-.*-key'
git secrets --add --allowed 'your-.*-secret'
git secrets --add --allowed 'example'
git secrets --add --allowed 'placeholder'

echo "✅ git-secrets configured successfully!"
echo ""
echo "Testing configuration..."
git secrets --list
