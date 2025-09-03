# Booby_Blendz Barbershop - Supabase Setup Script
# Run this script in PowerShell to set up the backend with Supabase

Write-Host "🚀 Setting up Booby_Blendz Barbershop Backend with Supabase..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
} else {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created!" -ForegroundColor Green
    Write-Host "⚠️  Please update .env with your Supabase credentials" -ForegroundColor Yellow
}

# Display next steps
Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Follow the Supabase setup guide in SUPABASE_SETUP.md" -ForegroundColor White
Write-Host "2. Update your .env file with Supabase credentials" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "4. Test the API endpoints" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see: SUPABASE_SETUP.md" -ForegroundColor Cyan

