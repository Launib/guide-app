# guide-app

## Get started

Make sure to have the expo go app installed on your phone to run the application there and for these steps to work.

# Frontend

1. Install dependencies

   ``` npm install ```

2. Start the app

   ``` npx expo start ```
   if this does not work run ``` npx expo start --tunnel ```

3.  update package.json if need be... ``` {
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-navigation/bottom-tabs": "^7.8.5",
    "@react-navigation/native": "^7.1.20",
    "expo": "^54.0.23",
    "expo-dev-client": "~6.0.17",
    "react-native-gesture-handler": "^2.29.1",
    "react-native-reanimated": "^4.1.5",
    "react-native-safe-area-context": "^5.6.2",
    "react-native-screens": "^4.18.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.10",
    "@types/react-native": "^0.72.8",
    "typescript": "~5.9.2"
  }
} ```

# Backend 

1. Make sure to be in the BACKEND/MyApiProject folder before running this command.
    ``` dotnet run ```

2. Database Information is held in appsettings.development.json and ignored in .gitignore not to be committed

3. Database is held in Avien Cloud 


Any Questions Let me know!