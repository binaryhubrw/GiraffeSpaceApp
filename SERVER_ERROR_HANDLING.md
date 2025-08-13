# Server Error Handling System

This system provides comprehensive error handling for server connectivity issues, specifically for the GiraffeSpace API server at `https://giraffespace-api.urbinaryhub.rw/api/v1`.

## Features

### 1. **Global Error Page (`/app/error.tsx`)**
- Displays when server is not responding
- Shows different messages for different error types
- Provides retry functionality
- Shows server URL and status
- Includes development error details

### 2. **Server Status Monitoring (`/hooks/useServerStatus.ts`)**
- Continuously monitors server connectivity
- Checks server every 30 seconds
- Detects network connectivity issues
- Provides real-time status updates

### 3. **Server Error Boundary (`/components/ServerErrorBoundary.tsx`)**
- Automatically shows error page when server is down
- Waits 5 seconds before showing error (prevents flashing)
- Provides loading states during checks

### 4. **Server Status Indicator (`/components/ServerStatusIndicator.tsx`)**
- Visual indicator of server status
- Can be added to header/navigation
- Shows tooltip with detailed information
- Clickable to manually check status

### 5. **Global Error Handler (`/utils/errorHandler.ts`)**
- Catches unhandled promise rejections
- Detects network/server errors
- Shows toast notifications
- Triggers error events

## How It Works

### Automatic Detection
1. **Server Health Check**: The system pings `/health` endpoint every 30 seconds
2. **Network Monitoring**: Detects when user goes offline/online
3. **Error Interception**: Catches API errors and network failures
4. **Smart Display**: Shows error page only after 5 seconds of server being down

### Error Types Handled
- **Network Errors**: No internet connection
- **Server Errors**: API server not responding
- **Timeout Errors**: Server taking too long to respond
- **CORS Errors**: Cross-origin request issues
- **5xx Status Codes**: Server-side errors

## Usage

### 1. **Automatic (Already Implemented)**
The system is already integrated into the main layout and will automatically:
- Monitor server status
- Show error page when server is down
- Handle API errors globally

### 2. **Manual Server Status Check**
```typescript
import { useServerStatus } from '@/hooks/useServerStatus'

function MyComponent() {
  const { isOnline, isChecking, checkServerStatus } = useServerStatus()
  
  return (
    <div>
      <p>Server Status: {isOnline ? 'Online' : 'Offline'}</p>
      <button onClick={checkServerStatus}>Check Status</button>
    </div>
  )
}
```

### 3. **Add Status Indicator to Header**
```typescript
import { ServerStatusIndicator } from '@/components/ServerStatusIndicator'

function Header() {
  return (
    <header>
      <h1>GiraffeSpace</h1>
      <ServerStatusIndicator />
    </header>
  )
}
```

### 4. **Custom Error Handling**
```typescript
import { handleApiError, isServerError } from '@/utils/errorHandler'

try {
  const response = await fetch('/api/data')
  // ... handle response
} catch (error) {
  if (isServerError(error)) {
    // Server is down - error page will show automatically
    console.log('Server error detected')
  } else {
    // Handle other errors
    handleApiError(error, 'fetching data')
  }
}
```

## Error Page Features

### Visual Indicators
- **Online**: Green WiFi icon with "Online" badge
- **Offline**: Red WiFi-off icon with "Offline" badge
- **Checking**: Yellow spinning refresh icon with "Checking..." badge

### User Actions
- **Try Again**: Tests server connectivity and reloads page if successful
- **Go Back**: Returns to previous page or home
- **Home**: Navigates to home page

### Information Display
- **Error Type**: Network, Server, or General error
- **Server URL**: Shows the API endpoint being checked
- **Last Check Time**: When the last connectivity test was performed
- **Development Details**: Error stack trace (development only)

## Configuration

### Server URL
The system is configured to monitor:
```
https://giraffespace-api.urbinaryhub.rw/api/v1
```

### Health Check Endpoint
The system checks:
```
https://giraffespace-api.urbinaryhub.rw/api/v1/health
```

### Timing Settings
- **Check Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Error Display Delay**: 5 seconds

## Testing

### Simulate Server Down
1. **Network Disconnect**: Turn off internet connection
2. **Server Down**: Stop the API server
3. **Timeout**: Add artificial delay to server responses

### Expected Behavior
1. **Immediate**: Status indicator shows "Checking..."
2. **After 5 seconds**: Error page displays
3. **User can**: Retry, go back, or go home
4. **When server returns**: Page automatically reloads

## Customization

### Change Server URL
Edit `/hooks/useServerStatus.ts`:
```typescript
const SERVER_URL = 'https://your-server.com/api/v1'
```

### Modify Check Interval
Edit the interval in `useServerStatus.ts`:
```typescript
const interval = setInterval(checkServerStatus, 60000) // 1 minute
```

### Custom Error Messages
Edit `/app/error.tsx` to customize error messages and styling.

## Troubleshooting

### Error Page Not Showing
1. Check if `ServerErrorBoundary` is in the layout
2. Verify server URL is correct
3. Check browser console for errors

### Status Indicator Not Working
1. Ensure `useServerStatus` hook is imported
2. Check if component is client-side rendered
3. Verify network connectivity

### False Positives
1. Check server health endpoint is responding
2. Verify CORS settings on server
3. Check browser network tab for failed requests

## Best Practices

1. **Always wrap API calls** in try-catch blocks
2. **Use the error handler** for consistent error messages
3. **Test offline scenarios** during development
4. **Monitor server status** in production
5. **Provide fallback content** for critical features

This system ensures users always know when the server is having issues and provides clear actions they can take to resolve or work around the problem. 