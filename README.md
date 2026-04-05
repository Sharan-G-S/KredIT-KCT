# KredIT - Club Credit & Contribution Tracking System

Kumaraguru College of Technology, Coimbatore

## Overview

KredIT is a digital platform for formally recognizing student contributions in clubs, forums, and student-led initiatives through a structured credit and evaluation system.

### Key Features

- **Activity Logging**: Students log daily work with proof submission
- **Admin Review**: Admin evaluates and approves/rejects submissions  
- **Credit Tracking**: Automated credit calculation based on evaluation criteria
- **Certificate Generation**: Digital co-curricular certificates
- **Responsive**: Works on all devices (desktop, tablet, mobile)

### Roles

| Role | Access |
|------|--------|
| **Student** | Log activities, upload proof, track credits, view achievements |
| **Admin** | Review logs, manage clubs/users, configure credits, generate reports |

### Credit System

- Maximum **25 credits** across the entire degree
- **5-6 credits per year** (2 semesters)
- **3 credits max per semester**
- Credits based on contribution quality and event-level multipliers

### Event Level Multipliers

| Level | Multiplier |
|-------|-----------|
| International | x1.5 |
| National | x1.4 |
| State | x1.2 |
| District/Local | x1.0 |
| Intra-College | x1.0 |

### Technical vs Non-Technical Evaluation

**Technical Clubs**: Project Contribution (30%), Technical Innovation (25%), Competition (20%), Workshop Organization (15%), Team Collaboration (10%)

**Non-Technical Clubs**: Event Organization (30%), Leadership Roles (25%), Creative Contribution (20%), Event Participation (15%), Team Collaboration (10%)

## Setup

1. Clone the repository
2. Deploy to Vercel: `vercel --prod`
3. Or serve locally: `npx serve . -p 3000`

## Login

- **Students**: Sign up with @kct.ac.in email
- **Admin**: sharan.admin@kct.ac.in

## Tech Stack

- Pure HTML, CSS, JavaScript (no framework)
- localStorage for client-side persistence  
- Microsoft MSAL for Azure AD SSO (configurable)
- Supabase-ready for database integration

## Deployment

This project is configured for Vercel deployment. Push to GitHub and connect to Vercel for automatic deployments.

```bash
git add .
git commit -m "KredIT v1.0"
git push origin main
```
