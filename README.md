# guide-app

# To run your project, navigate to the directory and run one of the following npm commands.

- cd guide
- npm run android
- npm run ios # you need to use macOS to build the iOS project - use the Expo app if you need to do iOS development without a Mac
- npm run web

# FRONTEND

# BACKEND   
- Download .NET SDK https://dotnet.microsoft.com/en-us/download
- ran dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer for RBAC token for secure frontend login
- ran dotnet add package Microsoft.EntityFrameworkCore.Design
- 


# Database
- Steps taken to create the database: 
- ran dotnet new webapi -n MyApiProject to create backend
- cd .\MyApiProject\
- ran dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
- ran dotnet add package Microsoft.EntityFrameworkCore.Tools
- ran dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
- added .gitIgnore file