# Withdrawals Feature Documentation

## Overview
A new "Withdraws" section has been added to the admin panel to manage user withdrawal requests.

## Files Created

### 1. Type Definitions
**File:** `src/types/domain.ts`
- Added `Withdraw` interface with user details, amount, status, and timestamps

### 2. API Service Layer
**File:** `src/api/withdraws.ts`
- `fetchWithdraws()` - Get paginated list with filters
- `approveWithdraw()` - Approve a pending withdrawal
- `cancelWithdraw()` - Cancel a withdrawal without refund

### 3. React Query Hooks
**File:** `src/features/withdraws/hooks.ts`
- `useWithdrawsTable()` - Fetch and cache withdrawals data
- `useApproveWithdraw()` - Mutation for approving withdrawals
- `useCancelWithdraw()` - Mutation for canceling withdrawals

### 4. UI Components
**File:** `src/features/withdraws/WithdrawsTable.tsx`
- Displays withdrawal requests in a table
- Columns: ID (shortened), User Name, User Email, Amount, Status, Created At, Actions
- Color-coded status badges (pending=orange, success=green, canceled=red)
- Action buttons for pending requests only

**File:** `src/features/withdraws/WithdrawsPage.tsx`
- Main page with filters and table
- Filters: Status dropdown, User search, Date range
- Pagination with configurable page size (default: 50)

### 5. Routing
**File:** `src/routes/AppRouter.tsx`
- Added "Withdraws" menu item with WalletOutlined icon
- Added `/withdraws` route with protected access

## Features

### Filtering
- **Status**: Filter by pending, success, or canceled
- **User Search**: Search by user email or ID
- **Date Range**: Filter by creation date range

### Actions
- **Approve**: Available only for pending withdrawals
  - Calls `POST /api/admin/withdraw/:id/success`
  - Shows confirmation dialog
  - Updates status to "success"
  - Shows success notification

- **Cancel**: Available only for pending withdrawals
  - Calls `POST /api/admin/withdraw/:id/cancel`
  - Shows confirmation dialog
  - Updates status to "canceled" without refund
  - Shows success notification

### UX Features
- Confirmation dialogs before approve/cancel actions
- Loading states during API calls
- Automatic table refresh after actions
- Toast notifications for success/error
- Responsive table with horizontal scroll
- Tooltip on ID showing full value
- Formatted money display
- Formatted date/time display

## API Integration

### GET /api/admin/withdraws
**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `status` (optional: "pending" | "success" | "canceled")
- `user` (optional: userId)
- `from` (optional: ISO date)
- `to` (optional: ISO date)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "...",
        "user": {
          "_id": "...",
          "name": "...",
          "email": "..."
        },
        "amount": 100,
        "status": "pending",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "pages": 1
    }
  }
}
```

### POST /api/admin/withdraw/:id/success
Approves a pending withdrawal.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Заявка подтверждена",
    "withdraw": { ...updated item... }
  }
}
```

### POST /api/admin/withdraw/:id/cancel
Cancels a withdrawal without refund.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Заявка отменена администратором (без возврата)",
    "withdraw": { ...updated item... }
  }
}
```

## Authentication
All endpoints require admin JWT token:
- Header: `Authorization: Bearer <token>`
- Auto-handled by axios interceptors
- 401 responses redirect to login

## Code Style
- Follows existing admin panel patterns
- TypeScript strict typing
- React Query for state management
- Ant Design components
- Consistent naming conventions
- Proper error handling
- Loading states
- User feedback via notifications

## Testing
To test the feature:
1. Navigate to `/withdraws` or click "Withdraws" in sidebar
2. View the list of withdrawal requests
3. Use filters to narrow down results
4. Click "Approve" on a pending withdrawal
5. Confirm the action
6. Verify status changes to "success"
7. Try canceling a pending withdrawal
8. Verify proper error handling when API fails
