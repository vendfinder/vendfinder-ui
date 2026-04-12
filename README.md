# VendFinder UI

A modern marketplace platform built with Next.js and deployed on DigitalOcean Kubernetes.

## Features

- User authentication and profiles
- Product listings and search
- Shopping cart and checkout
- Payment processing (Stripe)
- Real-time messaging
- Order management
- Vendor dashboard

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Infrastructure**: DigitalOcean Kubernetes
- **CI/CD**: GitHub Actions
- **Container Registry**: DigitalOcean Container Registry

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

The application uses automated CI/CD with GitHub Actions:

- **CI Pipeline**: Runs tests, builds Docker images, security scans
- **Staging**: Auto-deploys to staging on main branch
- **Production**: Manual deployment with version tags

## CI/CD Pipeline Test

✅ Pipeline configured and ready for testing
