#!/bin/bash

# setup.sh - Setup script for Polaroid Light API
# This script sets up the development environment and starts the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Polaroid Light API Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Check Node.js installation
check_node() {
    print_info "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    print_success "Node.js ${NODE_VERSION} detected"
}

# Check npm installation
check_npm() {
    print_info "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_success "npm ${NPM_VERSION} detected"
}

# Check PostgreSQL installation
check_postgres() {
    print_info "Checking PostgreSQL installation..."
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Make sure PostgreSQL is running."
        print_info "You can install PostgreSQL from: https://www.postgresql.org/download/"
    else
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL ${PSQL_VERSION} detected"
    fi
}

# Create .env file
create_env_file() {
    print_info "Creating .env file..."
    
    if [ -f .env ]; then
        print_warning ".env file already exists. Backing up to .env.backup"
        cp .env .env.backup
    fi
    
    # Default values
    DEFAULT_DB_NAME="polaroid_light"
    DEFAULT_DB_USER="postgres"
    DEFAULT_DB_PASSWORD="postgres"
    DEFAULT_DB_HOST="localhost"
    DEFAULT_DB_PORT="5432"
    DEFAULT_APP_PORT="3000"
    
    # Interactive mode or use defaults
    if [ "$1" != "--auto" ]; then
        echo
        print_info "Database Configuration"
        read -p "Database name [${DEFAULT_DB_NAME}]: " DB_NAME
        DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}
        
        read -p "Database user [${DEFAULT_DB_USER}]: " DB_USER
        DB_USER=${DB_USER:-$DEFAULT_DB_USER}
        
        read -sp "Database password [${DEFAULT_DB_PASSWORD}]: " DB_PASSWORD
        DB_PASSWORD=${DB_PASSWORD:-$DEFAULT_DB_PASSWORD}
        echo
        
        read -p "Database host [${DEFAULT_DB_HOST}]: " DB_HOST
        DB_HOST=${DB_HOST:-$DEFAULT_DB_HOST}
        
        read -p "Database port [${DEFAULT_DB_PORT}]: " DB_PORT
        DB_PORT=${DB_PORT:-$DEFAULT_DB_PORT}
        
        read -p "Application port [${DEFAULT_APP_PORT}]: " APP_PORT
        APP_PORT=${APP_PORT:-$DEFAULT_APP_PORT}
    else
        DB_NAME=$DEFAULT_DB_NAME
        DB_USER=$DEFAULT_DB_USER
        DB_PASSWORD=$DEFAULT_DB_PASSWORD
        DB_HOST=$DEFAULT_DB_HOST
        DB_PORT=$DEFAULT_DB_PORT
        APP_PORT=$DEFAULT_APP_PORT
    fi
    
    # Write .env file
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public

# Server Configuration
PORT=${APP_PORT}
NODE_ENV=development

# Logging
LOG_LEVEL=info

# API Version
API_VERSION=1.0.0

# CORS Origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF

    print_success ".env file created successfully"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    print_info "Running database migrations..."
    npx prisma migrate dev --name init
    
    print_success "Database setup completed"
}

# Seed database (optional)
seed_database() {
    print_info "Seeding database with initial data..."
    
    # Create seed script if it doesn't exist
    if [ ! -f "src/scripts/seed.ts" ]; then
        mkdir -p src/scripts
        cat > src/scripts/seed.ts << 'EOF'
import prisma from '../lib/prisma';
import logger from '../utils/logger';

async function seed() {
  try {
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@polaroid.com' },
        update: {},
        create: {
          id: 'admin-user',
          email: 'admin@polaroid.com',
          name: 'Admin User'
        }
      }),
      prisma.user.upsert({
        where: { email: 'test@polaroid.com' },
        update: {},
        create: {
          email: 'test@polaroid.com',
          name: 'Test User'
        }
      })
    ]);

    logger.info('Users seeded', { count: users.length });

    const films = await Promise.all([
      prisma.film.create({
        data: {
          title: 'The Matrix',
          description: 'A computer hacker learns about the true nature of reality',
          price: 999,
          videoUrl: 'https://example.com/matrix.mp4',
          uploadedBy: users[0].id
        }
      }),
      prisma.film.create({
        data: {
          title: 'Inception',
          description: 'A thief who steals corporate secrets through dream-sharing',
          price: 1299,
          videoUrl: 'https://example.com/inception.mp4',
          uploadedBy: users[0].id
        }
      })
    ]);

    logger.info('Films seeded', { count: films.length });
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
EOF
    fi
    
    # Run seed script
    npx ts-node src/scripts/seed.ts
    print_success "Database seeded successfully"
}

# Verify setup
verify_setup() {
    print_info "Verifying setup..."
    
    # Check if all required files exist
    required_files=("src/server.ts" "src/app.ts" "prisma/schema.prisma" ".env")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file not found: $file"
            exit 1
        fi
    done
    
    # Test database connection
    print_info "Testing database connection..."
    npx prisma db push --force-reset --skip-generate &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed. Please check your DATABASE_URL in .env"
        exit 1
    fi
}

# Start the application
start_app() {
    print_info "Starting the application..."
    echo
    print_success "Setup completed successfully!"
    print_info "Starting the development server..."
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Polaroid Light API is starting...${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    
    # Start in development mode
    npm run dev
}

# Main setup flow
main() {
    # Parse arguments
    AUTO_MODE=false
    SKIP_SEED=false
    
    for arg in "$@"; do
        case $arg in
            --auto)
                AUTO_MODE=true
                ;;
            --skip-seed)
                SKIP_SEED=true
                ;;
            --help)
                echo "Usage: ./setup.sh [options]"
                echo "Options:"
                echo "  --auto       Run in automatic mode with default values"
                echo "  --skip-seed  Skip database seeding"
                echo "  --help       Show this help message"
                exit 0
                ;;
        esac
    done
    
    # Run setup steps
    check_node
    check_npm
    check_postgres
    
    if [ "$AUTO_MODE" = true ]; then
        create_env_file --auto
    else
        create_env_file
    fi
    
    install_dependencies
    setup_database
    
    if [ "$SKIP_SEED" = false ]; then
        if [ "$AUTO_MODE" = true ]; then
            seed_database
        else
            read -p "Would you like to seed the database with sample data? (y/N): " seed_choice
            if [[ $seed_choice =~ ^[Yy]$ ]]; then
                seed_database
            fi
        fi
    fi
    
    verify_setup
    
    # Ask to start the app
    if [ "$AUTO_MODE" = true ]; then
        start_app
    else
        read -p "Setup complete! Would you like to start the application now? (Y/n): " start_choice
        if [[ ! $start_choice =~ ^[Nn]$ ]]; then
            start_app
        else
            print_info "You can start the application later with: npm run dev"
        fi
    fi
}

# Error handling
trap 'print_error "An error occurred. Setup failed."; exit 1' ERR

# Run main function
main "$@"