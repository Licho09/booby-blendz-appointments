# Booby_Blendz Email-to-SMS Backend Setup Script

Write-Host "🚀 Setting up Booby_Blendz Email-to-SMS Backend..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
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
    Write-Host "✅ .env file created. Please edit it with your email credentials." -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit the .env file with your email credentials" -ForegroundColor White
Write-Host "2. For Gmail, generate an App Password:" -ForegroundColor White
Write-Host "   - Go to Google Account settings" -ForegroundColor White
Write-Host "   - Enable 2-Step Verification" -ForegroundColor White
Write-Host "   - Go to Security > App passwords" -ForegroundColor White
Write-Host "   - Generate app password for 'Mail'" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the server" -ForegroundColor White
Write-Host ""
Write-Host "📧 Supported carriers: AT&T, Verizon, T-Mobile, Sprint, Boost, Cricket, Metro, US Cellular, Virgin, Google Fi" -ForegroundColor Cyan
