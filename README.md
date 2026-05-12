# SCHOOLFEES

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Backend Server

The application also includes a backend server built with Node.js and Express. To run the backend server:

```bash
npm run dev
```

This will start the server on port 3000 and connect to Firebase Firestore.

## Firebase Setup

This application uses Firebase Firestore for data storage. Before running the backend server, you need to configure Firebase:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore database in your project
3. Create a service account and download the JSON credentials
4. Update the [.env](file:///c%3A/Users/chris\OneDrive\Desktop\SYSTEM\.env) file with your Firebase credentials

See [FIREBASE_SETUP.md](file:///c%3A/Users/chris\OneDrive\Desktop\SYSTEM\FIREBASE_SETUP.md) for detailed instructions on setting up Firebase.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
