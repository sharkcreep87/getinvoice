# GetInvoice - Modern CRM & Invoice Management System

A modern, full-featured CRM system with powerful invoice generation capabilities. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Customer Relationship Management (CRM)**
  - Complete customer database management
  - Track customer information, contacts, and history
  - Advanced search and filtering

- **Invoice Generator**
  - Professional invoice creation with view and edit capabilities
  - PDF export with customizable templates
  - Multiple invoice statuses (Draft, Sent, Paid, Overdue, Cancelled)
  - Automatic calculations for subtotals, taxes, and discounts
  - Invoice numbering system
  - Customizable company branding (logo, details, terms & conditions)
  - Company logo upload support

- **User Management**
  - Secure authentication with Supabase Auth
  - Role-based access control (Admin/User)
  - Profile management

- **Subscription Management**
  - Multiple subscription tiers (Free, Basic, Pro, Enterprise)
  - Stripe payment integration for secure transactions
  - Automatic subscription billing and management
  - Usage limits based on subscription
  - Easy upgrade/downgrade functionality
  - Subscription cancellation support

- **Modern Dashboard**
  - Beautiful magenta/pink gradient theme
  - Real-time analytics and statistics
  - Revenue tracking
  - Recent activity overview
  - Company settings management

- **Production Ready**
  - Docker containerization
  - Environment-based configuration
  - Security best practices with RLS (Row Level Security)

## Tech Stack

- **Frontend**: Next.js 16.0.5 (App Router), React 18.3.1, TypeScript
- **Styling**: Tailwind CSS with custom magenta theme, Radix UI Components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Row Level Security)
- **Payment Processing**: Stripe for subscription payments
- **PDF Generation**: jsPDF with autoTable
- **Deployment**: Docker, Docker Compose

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for containerized deployment)
- Supabase account (free tier available at https://supabase.com)
- Stripe account (for payment processing - https://stripe.com)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd getinvoice
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at https://supabase.com
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Configuration (for payment processing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 5. Set Up the Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration scripts in order:
   - `supabase/migrations/001_initial_schema.sql` - Core tables (profiles, customers, invoices)
   - `supabase/migrations/002_subscription_system.sql` - Payment and subscription tables
   - `supabase/migrations/003_company_settings_and_storage.sql` - Company settings table
4. Set up Storage for company logos:
   - **IMPORTANT**: Follow the dashboard method in `supabase/STORAGE_SETUP_DASHBOARD.md`
   - This creates the 'public' bucket and policies for logo uploads
   - (The SQL method requires system permissions and won't work in SQL Editor)

### 6. Set Up Stripe (Optional but recommended)

For full subscription payment functionality:

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks for payment notifications
4. See [STRIPE_SETUP.md](STRIPE_SETUP.md) for detailed instructions

### 7. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build the image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t getinvoice .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  getinvoice
```

## Project Structure

```
getinvoice/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── customers/     # Customer management
│   │   │   ├── invoices/      # Invoice management
│   │   │   ├── subscription/  # Subscription management
│   │   │   └── settings/      # User settings
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── supabase/          # Supabase client configuration
│       ├── utils.ts           # Utility functions
│       └── invoice-pdf.ts     # PDF generation logic
├── supabase/
│   └── schema.sql             # Database schema
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose configuration
└── README.md
```

## Database Schema

### Tables

- **profiles**: User profiles with subscription information
- **customers**: Customer database
- **invoices**: Invoice records
- **invoice_items**: Line items for invoices
- **subscription_plans**: Available subscription tiers

### Security

All tables use Row Level Security (RLS) policies to ensure users can only access their own data.

## Subscription Tiers

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Price | $0/mo | $19/mo | $49/mo | $199/mo |
| Customers | 5 | 50 | Unlimited | Unlimited |
| Invoices/month | 10 | 100 | Unlimited | Unlimited |
| Support | Basic | Email | Priority | Dedicated |
| PDF Export | ✓ | ✓ | ✓ | ✓ |
| Analytics | Basic | Advanced | Advanced | Custom |
| API Access | ✗ | ✗ | ✓ | ✓ |
| Multi-user | ✗ | ✗ | ✗ | ✓ |

## Key Features Guide

### Creating Customers

1. Navigate to Dashboard > Customers
2. Click "Add Customer"
3. Fill in customer information
4. Save

### Generating Invoices

1. Navigate to Dashboard > Invoices
2. Click "New Invoice"
3. Select a customer
4. Add invoice items (description, quantity, price)
5. Set tax rate and discounts
6. Add notes and terms
7. Create invoice

### Exporting Invoice PDFs

1. Go to the Invoices list
2. Click the download icon on any invoice
3. PDF will be generated and downloaded automatically

### Managing Subscription

1. Navigate to Dashboard > Subscription
2. View current plan
3. Click "Upgrade" or "Downgrade" on desired plan
4. Confirm changes

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Adding New Features

The application follows Next.js 14 App Router conventions:

- Add new pages in `src/app/`
- Create reusable components in `src/components/`
- Add utility functions in `src/lib/`
- Database types are defined in `src/lib/supabase/database.types.ts`

## Security Considerations

- All database operations use Row Level Security (RLS)
- Authentication is handled by Supabase Auth
- Environment variables are required for API keys
- HTTPS is recommended for production deployments
- Service role keys should never be exposed to the client

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Yes |
| NEXT_PUBLIC_APP_URL | Application URL | No |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key | Yes* |
| STRIPE_SECRET_KEY | Stripe secret key | Yes* |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | Yes* |

*Required for payment processing. The app will work without Stripe but subscription payments will be disabled.

## Troubleshooting

### Database Connection Issues

- Verify Supabase credentials in `.env.local`
- Check if database schema has been applied
- Ensure RLS policies are enabled

### Authentication Problems

- Clear browser cookies and cache
- Verify Supabase Auth is enabled in your project
- Check email confirmation settings in Supabase

### PDF Generation Issues

- Ensure all invoice data is properly loaded
- Check browser console for errors
- Verify jsPDF dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact support@getinvoice.com or open an issue on GitHub.

## Roadmap

- [ ] Email invoice sending
- [ ] Recurring invoices
- [ ] Payment gateway integration
- [ ] Multi-currency support
- [ ] Invoice templates customization
- [ ] Mobile app
- [ ] API documentation
- [ ] Webhooks

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and Auth by [Supabase](https://supabase.com/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
