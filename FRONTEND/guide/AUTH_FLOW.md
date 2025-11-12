# Authentication & Onboarding Flow Guide

## Overview

The app now includes a complete first-time user experience with:

1. **Onboarding Slider** - 3-slide carousel with skip/next buttons
2. **Authentication Page** - Login/Sign Up toggle
3. **Login Page** - Username, password, and address collection
4. **Sign Up Page** - Account creation with account-type-specific fields

## Architecture

### Component Hierarchy

```
RootLayout (_layout.tsx)
├── Loading Placeholder (while checking flags)
├── Onboarding (first-time users)
├── AuthPage (not yet authenticated)
│   ├── LoginPage
│   └── SignUpPage
└── Stack (authenticated users)
    └── index.tsx (home screen)
```

### Data Persistence

- `hasSeenOnboarding` - Tracks if user completed onboarding (AsyncStorage)
- `userToken` - Stores username on login/signup (AsyncStorage)

### Components

- **app/components/onboarding.tsx** - Horizontal scroll slider with 3 slides
- **app/components/auth-page.tsx** - Toggle between login/signup modes
- **app/components/login-page.tsx** - Login form with address fields
- **app/components/signup-page.tsx** - Signup with account type selection
- **app/\_layout.tsx** - Root navigator with auth state management

## Login Flow

### Username & Password

- Field: Username (required)
- Field: Password (required, hidden)

### Address Information

- Field: Street Address (required)
- Field: Apt Number (optional)
- Field: Zip Code (required)
- Field: State (required)
- Field: City (required)

## Sign Up Flow

### Basic Information

- Field: Username (required)
- Field: Password (required, hidden)
- Field: First Name (required)
- Field: Last Name (required)
- Select: Account Type (required)
  - Regular User
  - Admin
  - Business
  - City Admin

### Account-Type-Specific Fields

#### Admin

- Department Name (required)

#### Business

- Business Name (required)
- Business License (required)

#### City Admin

- City Name (required)
- Government ID (required)

#### Regular User

- No additional fields

## Testing Checklist

### First Launch

1. [ ] App shows loading placeholder briefly
2. [ ] Onboarding slider appears with 3 slides
3. [ ] Pagination dots update as user swipes
4. [ ] Skip button dismisses onboarding
5. [ ] Next button progresses through slides
6. [ ] Get Started button on final slide triggers auth page

### Authentication Page

1. [ ] Login and Sign Up buttons are visible
2. [ ] Clicking Login shows login form
3. [ ] Clicking Sign Up shows signup form
4. [ ] Back button returns to auth page

### Login Page

1. [ ] All fields are input boxes
2. [ ] Password field is masked
3. [ ] Form validates required fields
4. [ ] Submit stores userToken in AsyncStorage
5. [ ] User is taken to main app after login

### Sign Up Page

1. [ ] Basic fields display correctly
2. [ ] Account Type dropdown shows all 5 options
3. [ ] Admin fields appear when "Admin" selected
4. [ ] Business fields appear when "Business" selected
5. [ ] City Admin fields appear when "City Admin" selected
6. [ ] Regular User shows no additional fields
7. [ ] Changing account type clears previous type's fields
8. [ ] Form validates required fields
9. [ ] Submit stores userToken in AsyncStorage

### Persistence

1. [ ] Close and reopen app - should skip onboarding
2. [ ] Close and reopen app - should skip auth (shows main app)
3. [ ] Clear app data - should show onboarding again
4. [ ] Clear AsyncStorage manually - should show auth page

## Running the App

```bash
cd FRONTEND/guide
npm start
```

Then open in:

- Expo Go (scan QR code on phone)
- iOS Simulator: press `i`
- Android Emulator: press `a`
- Web: press `w`

## API Integration

The following endpoints need to be connected:

### Login

- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "username": string,
    "password": string,
    "street": string,
    "apt": string,
    "zipCode": string,
    "state": string,
    "city": string
  }
  ```
- **Response**: `{ token: string, user: {...} }`

### Sign Up

- **Endpoint**: `POST /auth/signup`
- **Body**:
  ```json
  {
    "username": string,
    "password": string,
    "firstName": string,
    "lastName": string,
    "accountType": "regular" | "admin" | "business" | "city_admin",
    "departmentName": string (if admin),
    "businessName": string (if business),
    "businessLicense": string (if business),
    "cityName": string (if city_admin),
    "governmentId": string (if city_admin)
  }
  ```
- **Response**: `{ token: string, user: {...} }`

### Current Implementation

Currently, login/signup simulate success by storing the username as `userToken`. Replace the `handleSubmit` functions in `login-page.tsx` and `signup-page.tsx` with actual API calls:

```typescript
const response = await fetch("YOUR_API_URL/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});

const data = await response.json();
await AsyncStorage.setItem("userToken", data.token);
onSuccess?.();
```

## Notes

- All UI components are built with React Native core components (no external UI libraries)
- Responsive layout using flexbox
- AsyncStorage for local persistence
- Form validation on submit
- Error handling with Alert dialogs
- Back navigation between auth modes and onboarding
