# Admin Panel User Guide

## Accessing the Withdrawals Section

### Navigation
1. Log in to the admin panel at `/login`
2. Click on "Withdraws" in the left sidebar (wallet icon)
3. You'll be taken to the Withdraw Requests page

## Managing Withdrawal Requests

### Viewing Withdrawals
The withdrawals table displays:
- **ID**: Shortened withdrawal ID (hover to see full ID)
- **User Name**: Name of the user requesting withdrawal
- **User Email**: Email address of the user
- **Amount**: Withdrawal amount in USD (formatted as currency)
- **Status**: Current status with color coding
  - 🟠 **PENDING**: Awaiting admin action
  - 🟢 **SUCCESS**: Approved and processed
  - 🔴 **CANCELED**: Canceled by admin
- **Created At**: When the request was created
- **Actions**: Available actions based on status

### Filtering Requests
Use the filter bar at the top to narrow down results:

1. **Status Filter**
   - Select "Pending" to see only requests awaiting action
   - Select "Success" to see approved withdrawals
   - Select "Canceled" to see canceled requests
   - Clear filter to see all

2. **User Search**
   - Enter user email or ID
   - Search is performed as you type

3. **Date Range**
   - Click the date picker
   - Select start and end dates
   - Clear to remove date filter

### Approving Withdrawals
1. Locate the withdrawal request with **PENDING** status
2. Click the **"Approve"** button
3. Confirm the action in the dialog
4. The system will:
   - Send approval to backend API
   - Update status to **SUCCESS**
   - Show success notification
   - Refresh the table automatically

### Canceling Withdrawals
1. Locate the withdrawal request with **PENDING** status
2. Click the **"Cancel"** button (red)
3. Confirm the action in the dialog
4. **Important**: Canceling does NOT refund the user
5. The system will:
   - Send cancellation to backend API
   - Update status to **CANCELED**
   - Show success notification
   - Refresh the table automatically

### Pagination
- Default page size: 50 items
- Use the pagination controls at the bottom
- Change page size from the dropdown (10, 20, 50, 100)
- Total count is displayed

## Best Practices

### Before Approving
✅ Verify user identity
✅ Check withdrawal amount
✅ Ensure compliance with withdrawal policies
✅ Confirm payment method availability

### Before Canceling
⚠️ Remember: Cancellation does NOT refund the user
⚠️ Double-check before confirming
⚠️ Consider communicating with user first

### Workflow Tips
1. Filter by "Pending" status to see only actionable items
2. Process withdrawals in order (oldest first)
3. Use date range to focus on specific time periods
4. Keep the tab open to monitor new requests
5. Refresh browser if table seems outdated

## Error Handling

### If Approval Fails
- Error notification will appear
- Check console for details
- Verify backend API is running
- Ensure authentication token is valid
- Try again or contact technical support

### If Cancel Fails
- Same troubleshooting steps as approval
- Verify the withdrawal is still in PENDING status
- Check network connectivity

## Technical Notes

### API Endpoints Used
- `GET /api/admin/withdraws` - Fetch withdrawal list
- `POST /api/admin/withdraw/:id/success` - Approve withdrawal
- `POST /api/admin/withdraw/:id/cancel` - Cancel withdrawal

### Authentication
- All requests require admin JWT token
- Token is automatically included in requests
- If token expires, you'll be redirected to login

### Status Flow
```
PENDING → (Approve) → SUCCESS
PENDING → (Cancel)  → CANCELED
```

Once a withdrawal is SUCCESS or CANCELED, no further actions are available.

## Keyboard Shortcuts
- **Tab**: Navigate between filters
- **Enter**: Apply search/filter
- **Esc**: Close confirmation dialogs

## Support
For technical issues or questions:
- Check browser console for errors
- Verify API server is running
- Contact development team with error details
