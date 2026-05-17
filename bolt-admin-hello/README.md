# Admin Panel

A full-featured admin panel for managing users, withdrawals, VIP plans, and viewing analytics. Built with React, TypeScript, Ant Design, and React Query.

## Features

### Users Management
- **CRUD Operations**: Create, read, update, and delete users
- **Search & Filters**: Search by name/email, filter by email verification status, date range
- **User Details**: View comprehensive user information in a drawer with tabs:
  - Profile: Basic info, wallet balances, and statistics
  - Games: History of games played with pagination
  - Deposits: Transaction history with filtering
  - Referrals: Two-level referral system visualization
  - Wallet: Complete wallet details
- **Balance Adjustment**: Adjust deposit, earned, and referral balances with reason tracking
- **Export**: Export user data to CSV

### Withdrawals Management
- **View Requests**: List all withdrawal requests with pagination
- **Search & Filters**: Filter by status (pending/success/canceled), user, and date range
- **Status Management**:
  - Approve pending withdrawals (mark as success)
  - Cancel pending withdrawals without refund
- **Detailed View**: See user info, amount, status, and creation date
- **Status Indicators**: Color-coded badges (pending=orange, success=green, canceled=red)

### VIP Plans Management
- **CRUD Operations**: Create, read, update, and delete VIP plans
- **Dynamic Features**: Configure min/max thresholds, daily rates, cashback, icons, and feature items
- **Search**: Search VIP plans by title
- **Export**: Export VIP plans to CSV

### Dashboard
- **Key Metrics**: Total users, deposited amount, earned amount, and games count
- **Top Referrers**: View the top 5 users by referral count
- **Date Filtering**: Filter all metrics by custom date range

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Ant Design** - UI component library
- **React Router v6** - Routing
- **React Query** - Server state management
- **Axios** - HTTP client with interceptors
- **React Hook Form + Zod** - Form validation
- **Dayjs** - Date manipulation

## Project Structure

```
src/
├── api/                 # API service layer
│   ├── axios.ts         # Axios instance with interceptors
│   ├── auth.ts          # Authentication endpoints
│   ├── users.ts         # User CRUD and operations
│   ├── withdraws.ts     # Withdrawal requests management
│   ├── vips.ts          # VIP plans CRUD
│   └── stats.ts         # Dashboard statistics
├── components/          # Reusable components
│   ├── ConfirmButton.tsx
│   ├── DateRangePicker.tsx
│   ├── Money.tsx
│   ├── PageHeader.tsx
│   └── SearchBar.tsx
├── features/            # Feature modules
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/
│   │   ├── DashboardPage.tsx
│   │   ├── Cards.tsx
│   │   ├── Charts.tsx
│   │   └── hooks.ts
│   ├── users/
│   │   ├── UsersPage.tsx
│   │   ├── UsersTable.tsx
│   │   ├── UserDrawer.tsx
│   │   ├── CreateUserModal.tsx
│   │   ├── EditUserModal.tsx
│   │   ├── AdjustBalanceModal.tsx
│   │   └── hooks.ts
│   ├── withdraws/
│   │   ├── WithdrawsPage.tsx
│   │   ├── WithdrawsTable.tsx
│   │   └── hooks.ts
│   └── vips/
│       ├── VipsPage.tsx
│       ├── VipTable.tsx
│       ├── VipFormModal.tsx
│       └── hooks.ts
├── hooks/               # Custom hooks
│   └── useAuth.ts
├── routes/              # Routing configuration
│   └── AppRouter.tsx
├── types/               # TypeScript types
│   └── domain.ts
├── utils/               # Utility functions
│   ├── format.ts
│   └── table.ts
├── App.tsx
└── main.tsx
```

## API Endpoints

The application expects the following API endpoints:

### Authentication
- `POST /api/admin/login` - Admin login

### Users
- `GET /api/admin/users` - List users with filters
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/users/:id/wallet` - Get user wallet
- `POST /api/admin/users/:id/balance-adjust` - Adjust balance
- `GET /api/admin/users/:id/deposits` - Get user deposits
- `GET /api/admin/users/:id/games` - Get user games
- `GET /api/admin/users/:id/referrals` - Get user referrals

### Withdrawals
- `GET /api/admin/withdraws` - List withdrawal requests with filters
- `POST /api/admin/withdraw/:id/success` - Approve withdrawal request
- `POST /api/admin/withdraw/:id/cancel` - Cancel withdrawal request

### VIP Plans
- `GET /api/admin/vips` - List VIP plans
- `GET /api/admin/vips/:id` - Get VIP plan details
- `POST /api/admin/vips` - Create VIP plan
- `PATCH /api/admin/vips/:id` - Update VIP plan
- `DELETE /api/admin/vips/:id` - Delete VIP plan

### Statistics
- `GET /api/admin/stats/summary` - Get dashboard statistics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
VITE_API_BASE=http://localhost:3001
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Authentication

The application uses JWT Bearer token authentication:
- Token is stored in `localStorage` after successful login
- All API requests include `Authorization: Bearer <token>` header
- 401 responses automatically redirect to login page
- Logout clears the token and redirects to login

## Features Detail

### Form Validation
All forms use Zod schemas for validation:
- Required fields are clearly marked
- Email validation for email fields
- Minimum length validation for passwords
- Custom validation for balance adjustments

### Table Features
- Server-side pagination
- Column sorting
- Search functionality
- Row actions (View, Edit, Delete, Adjust)
- Empty states
- Loading skeletons

### Error Handling
- Axios interceptors catch all errors
- Toast notifications for errors and success messages
- Automatic token refresh on 401
- User-friendly error messages

### UX Enhancements
- Confirmation dialogs for destructive actions
- Loading states for async operations
- Copy to clipboard for referral codes
- Date range pickers with presets
- Responsive design for mobile devices
- CSV export functionality

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Add proper type definitions
4. Use React Query for data fetching
5. Validate forms with Zod
6. Follow Ant Design conventions
