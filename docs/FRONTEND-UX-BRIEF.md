# Frontend UX Brief - v3.2 Provider & League Selection

## Overview

This document specifies the user experience requirements for implementing provider and league selection in frontend applications using Sports Platform v3.2.

## User Flow Requirements

### 1. Sport Selection (Mandatory)
```
[Baseball ▼] [Hockey ▼] [Football] [Basketball]
     ↑ User must select sport first
```

**Requirements:**
- Sport selection is mandatory before any fantasy features
- Use dropdown or tab interface  
- Pass `sport` parameter to all API calls
- Auto-detect fallback available but not recommended for UX

### 2. Provider Selection (Required for Fantasy)
```
Fantasy Provider: ( ) ESPN  ( ) Yahoo
                     ↑ Single selection required
```

**Requirements:**
- Only show when user accesses fantasy features
- ESPN and Yahoo are currently supported providers
- Single selection (radio buttons, not checkboxes)
- Store selection in user session/preferences
- Pass `fantasyProvider` parameter to fantasy API calls

### 3. League Discovery & Selection
```
Select League: [My Main League ▼]
               ├─ My Main League (12 teams)
               ├─ Work League (10 teams) 
               └─ Family League (8 teams)
```

**Requirements:**
- Auto-populate from `/leagues` API call
- Show league name and team count
- Store selection in user session
- Pass `leagueId` parameter to all fantasy API calls
- Refresh button to reload leagues

## API Integration

### 1. League Discovery API
```javascript
// Call on provider selection or manual refresh
const response = await fetch(`/leagues?sport=${sport}&provider=${provider}&uid=${userId}`);
const { leagues } = await response.json();

// Example response
{
  "sport": "baseball",
  "provider": "espn", 
  "leagues": [
    {
      "id": "12345",
      "name": "My Main League",
      "provider": "espn",
      "sport": "baseball", 
      "teams": 12
    }
  ],
  "meta": {
    "total_leagues": 1,
    "timestamp": "2025-01-06T..."
  }
}
```

### 2. Session State Management
```javascript
// Required session state
const sessionState = {
  userId: "user123",
  sport: "baseball",           // Required for all calls
  fantasyProvider: "espn",     // Required for fantasy calls  
  leagueId: "12345"           // Required for fantasy calls
};

// Include in all API requests
const apiCall = {
  model: "gpt-4",
  input: userMessage,
  ...sessionState  // Spread session state
};
```

### 3. Error Handling
```javascript
// Handle missing league selection
async function handleAPIResponse(response) {
  const data = await response.json();
  
  if (data.error?.includes('league_id')) {
    // Show league picker modal
    await showLeaguePicker();
    return;
  }
  
  if (data.error?.includes('authentication required')) {
    // Redirect to provider OAuth
    window.location.href = `/auth/${provider}`;
    return;
  }
  
  // Handle successful response
  displayResponse(data);
}
```

## UI Components Specification

### 1. Sport Selector Component
```jsx
<SportSelector
  selectedSport={sport}
  onSportChange={setSport}
  availableSports={['baseball', 'hockey']}
  required={true}
/>
```

**Visual Requirements:**
- Prominent placement in header/navigation
- Clear visual indication of selection
- Disabled state for unavailable sports
- Tooltip with sport status (e.g., "Coming Soon" for football)

### 2. Fantasy Provider Component  
```jsx
<FantasyProviderSelector
  selectedProvider={fantasyProvider}
  onProviderChange={setFantasyProvider}
  providers={[
    { id: 'espn', name: 'ESPN Fantasy', icon: '/espn-icon.svg' },
    { id: 'yahoo', name: 'Yahoo Fantasy', icon: '/yahoo-icon.svg' }
  ]}
  required={true}
/>
```

**Visual Requirements:**
- Only show when fantasy features accessed
- Provider logos/icons for visual recognition
- Clear authentication status indicators
- Login/logout buttons integrated

### 3. League Picker Component
```jsx
<LeaguePicker
  leagues={leagues}
  selectedLeague={leagueId}
  onLeagueChange={setLeagueId}
  onRefresh={refreshLeagues}
  loading={loadingLeagues}
  error={leagueError}
/>
```

**Visual Requirements:**
- Dropdown with search/filter capability
- League details: name, team count, provider
- Loading states for discovery API calls
- Error states with retry option
- Empty state for no leagues found

## Authentication Flow

### ESPN Authentication
```javascript
// ESPN uses cookie-based auth - handle via redirect
function loginESPN() {
  // Redirect to ESPN login page
  window.location.href = '/auth/espn/login';
  
  // After successful login, ESPN cookies automatically included
  // in subsequent API calls
}
```

### Yahoo Authentication  
```javascript
// Yahoo uses OAuth 2.0 - handle via popup/redirect
function loginYahoo() {
  // Open OAuth popup or redirect
  const authUrl = '/auth/yahoo/oauth';
  window.open(authUrl, 'yahoo-auth', 'width=600,height=600');
  
  // Listen for auth completion
  window.addEventListener('message', handleOAuthResponse);
}
```

## State Persistence

### Local Storage Schema
```javascript
// Store user preferences
const userPreferences = {
  defaultSport: 'baseball',
  defaultProvider: 'espn',
  lastUsedLeagues: {
    'baseball:espn': '12345',
    'hockey:yahoo': '67890'
  },
  authStatus: {
    espn: { authenticated: true, expires: null },
    yahoo: { authenticated: true, expires: 1640995200 }
  }
};

localStorage.setItem('sportsPreferences', JSON.stringify(userPreferences));
```

### Session Restoration
```javascript
// On app load, restore user state
function restoreUserSession() {
  const prefs = JSON.parse(localStorage.getItem('sportsPreferences') || '{}');
  
  setSport(prefs.defaultSport || 'baseball');
  setFantasyProvider(prefs.defaultProvider || 'espn');
  
  // Auto-select last used league for current sport/provider
  const leagueKey = `${sport}:${fantasyProvider}`;
  setLeagueId(prefs.lastUsedLeagues?.[leagueKey] || null);
}
```

## Error States & Messaging

### User-Friendly Error Messages
```javascript
const errorMessages = {
  'Missing league_id': 'Please select a league from the dropdown above.',
  'League not found': 'This league is no longer available. Please select a different league.',
  'ESPN authentication required': 'Please log in to ESPN Fantasy to access your leagues.',
  'Yahoo authentication required': 'Please log in to Yahoo Fantasy to access your leagues.',
  'No leagues found': 'No fantasy leagues found for this provider. Create a league on {provider} first.'
};
```

### Progressive Disclosure
```
1. Show sport selector first
2. On fantasy access, show provider selector  
3. On provider selection, auto-load and show league selector
4. On league selection, enable all fantasy features
```

## Mobile Considerations

### Responsive Design
- Stack selectors vertically on mobile (<768px)
- Use bottom sheet for league picker on mobile
- Touch-friendly targets (44px minimum)
- Swipe gestures for sport switching

### Performance
- Cache league lists for 5 minutes
- Lazy load provider selection until needed
- Preload common sport/provider combinations
- Minimize API calls on mobile connections

## Accessibility

### ARIA Labels
```jsx
<select 
  aria-label="Select fantasy sports league"
  aria-describedby="league-help-text"
>
  <option value="">Choose a league...</option>
  {leagues.map(league => 
    <option key={league.id} value={league.id}>
      {league.name} ({league.teams} teams)
    </option>
  )}
</select>
```

### Keyboard Navigation
- Tab order: Sport → Provider → League → Features
- Escape key closes league picker modal
- Enter/Space activates selections
- Arrow keys navigate options

## Testing Requirements

### Unit Tests
- Component rendering with various props
- State management and updates
- Error handling and display
- API integration mocks

### Integration Tests  
- Full authentication flows
- League discovery and selection
- Session persistence and restoration
- Error recovery workflows

### E2E Tests
```javascript
// Example Cypress test
it('should allow user to select sport, provider, and league', () => {
  cy.visit('/');
  cy.get('[data-cy=sport-selector]').select('baseball');
  cy.get('[data-cy=fantasy-tab]').click();
  cy.get('[data-cy=provider-espn]').click();
  cy.get('[data-cy=league-selector]').should('be.visible');
  cy.get('[data-cy=league-selector]').select('My Main League');
  cy.get('[data-cy=fantasy-features]').should('be.enabled');
});
```

## Success Metrics

### User Experience
- Time to complete sport/provider/league selection <30 seconds
- League picker abandonment rate <10%
- Authentication completion rate >80%
- Error recovery success rate >90%

### Technical Performance
- League discovery API response time <500ms
- UI state updates <100ms
- Authentication flows complete <60 seconds
- Session restoration <200ms

## Summary

The v3.2 frontend UX should provide a smooth, intuitive flow for users to:

1. **Select their sport** (mandatory dropdown)
2. **Choose fantasy provider** (ESPN or Yahoo when needed)  
3. **Pick their league** (auto-discovered from provider)
4. **Access unlimited leagues** seamlessly

Key principles:
- **Progressive disclosure** - don't overwhelm with all options at once
- **Intelligent defaults** - remember user preferences
- **Clear error states** - guide users through authentication and selection
- **Mobile-first design** - responsive and touch-friendly
- **Performance-conscious** - cache and optimize API calls

This creates a foundation for the unlimited multi-league access that v3.2 enables while maintaining the proven 3-tool architecture performance.