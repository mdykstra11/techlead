#!/bin/bash
# Run this once from your project root to set up your local environment

set -e

echo "Setting up FieldPro local environment..."

# ── 1. Create .env.local ──────────────────────────────────────────────────────
if [ -f .env.local ]; then
  echo ".env.local already exists, skipping."
else
  cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://mllgyjqqyilzmoghkakc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGd5anFxeWlsem1vZ2hrYWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTQ5MzEsImV4cCI6MjA4ODc3MDkzMX0.59wvsz7kQxuPbxz1CiNNG6qUdkK73JTeX4AkWCy_61o

# Get this from: https://supabase.com/dashboard/project/mllgyjqqyilzmoghkakc/settings/api
# Under "Project API keys" → "service_role" (secret key)
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# Optional — AI photo analysis won't work without it, but app will still run
OPENAI_API_KEY=
EOF
  echo ".env.local created."
fi

echo ""
echo "──────────────────────────────────────────────────"
echo "NEXT STEPS:"
echo ""
echo "1. Add your SUPABASE_SERVICE_ROLE_KEY to .env.local"
echo "   → https://supabase.com/dashboard/project/mllgyjqqyilzmoghkakc/settings/api"
echo ""
echo "2. Apply the database schema (one-time):"
echo "   → https://supabase.com/dashboard/project/mllgyjqqyilzmoghkakc/sql/new"
echo "   → Paste contents of: supabase/migrations/001_schema.sql"
echo "   → Then paste: supabase/seed.sql"
echo ""
echo "3. Create a storage bucket:"
echo "   → https://supabase.com/dashboard/project/mllgyjqqyilzmoghkakc/storage/buckets"
echo "   → New bucket, name: opportunity-photos, keep private"
echo ""
echo "4. Run the app:"
echo "   npm install && npm run dev"
echo "──────────────────────────────────────────────────"
