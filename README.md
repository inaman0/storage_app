# Storage App

A Google Drive-style file storage application built with React, Vite, Express, MongoDB, and cookie-based authentication. Users can register or log in with OTP verification, optionally use Google Sign-In, then manage their own private directory tree with file uploads, downloads, renames, and deletes.

## Features

- Email/password registration with OTP verification.
- Email/password login with OTP verification.
- Google login and automatic account creation.
- Signed HTTP-only session cookie authentication.
- Private root directory for every user.
- Nested folders.
- Multiple file upload with upload progress.
- File preview/open in browser.
- File download.
- Rename files and directories.
- Delete files.
- Recursive directory deletion, including child folders and files.
- User menu with current profile details and logout.

## Tech Stack

### Client

- React 18
- Vite
- React Router
- React Icons
- Google OAuth React package

### Server

- Node.js
- Express
- MongoDB with Mongoose
- bcrypt password hashing
- cookie-parser signed cookies
- CORS with credentials
- Nodemailer for OTP email
- Google Auth Library for Google ID token verification

## Project Structure

```text
storage_app/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── DirectoryView.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── apis/
│   │   └── components/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── storage/
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js
- npm
- MongoDB running locally
- Google OAuth client ID, if using Google login
- Email account or mail provider credentials for OTP delivery

## Environment Variables

Create environment files before running the app.

### `server/.env`

```env
SECRET_KEY=your_cookie_signing_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

The database connection is currently defined in `server/config/db.js`. Update that file if your MongoDB username, password, host, port, or database name differs.

OTP email sending is implemented in `server/services/sendOtpService.js`. For production or shared code, move mail credentials into environment variables instead of keeping them in source code.

### `client/.env`

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Installation

Install server dependencies:

```bash
cd server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
```

## Running the App

Start MongoDB first.

Start the API server:

```bash
cd server
npm run dev
```

The server runs on:

```text
http://localhost:4000
```

Start the React client:

```bash
cd client
npm run dev
```

The client runs on:

```text
http://localhost:5173
```

The server CORS configuration allows requests from `http://localhost:5173` and supports credentials so the browser can send the signed `sid` cookie.

## Authentication Flow

The app uses a signed HTTP-only cookie named `sid`.

1. A user registers or logs in.
2. The server verifies OTP or Google credentials.
3. The server creates a `Session` document.
4. The server sets the signed `sid` cookie.
5. Protected routes read the cookie, find the session, load the user, and attach the user to `req.user`.

Protected API groups:

- `/directory/*`
- `/file/*`
- `GET /user`

Unauthenticated users receive:

```json
{ "error": "Not logged in!" }
```

## Frontend Routes

| Route | Component | Functionality |
| --- | --- | --- |
| `/` | `DirectoryView` | Shows the authenticated user's root directory, called "My Drive" in the UI. Redirects to `/login` when the API returns `401`. |
| `/directory/:dirId` | `DirectoryView` | Shows a specific directory by ID. Supports opening child directories, uploading files into the current directory, creating folders, renaming, deleting, opening files, and downloading files. |
| `/login` | `Login` | Lets users submit email/password, receive an OTP, verify the OTP, and create a session. Also supports Google login. |
| `/register` | `Register` | Lets users enter name/email/password, send and verify an OTP, then create an account. Also supports Google login. |

## UI Functionality

### Directory View

- Loads directory data from `GET /directory/:id?`.
- Shows directories and files together in a list.
- New items are shown first by reversing the server response.
- Clicking a directory navigates to `/directory/:dirId`.
- Clicking a file opens `GET /file/:id` in the browser.
- The create-folder button opens a modal and sends `POST /directory/:parentDirId?`.
- The upload button opens the native file picker and uploads selected files one by one with `POST /file/:parentDirId?`.
- Upload progress is tracked with `XMLHttpRequest.upload`.
- Right-click/context menu actions support rename, delete, download, and cancel upload.

### Header/User Menu

- Fetches the logged-in user from `GET /user`.
- Shows the user's name, email, and picture when available.
- Provides logout with `POST /user/logout`.
- Shows a login action when no user is authenticated.

## API Base URL

```text
http://localhost:4000
```

## API Routes

### Auth Routes

Base path: `/auth`

| Method | Route | Auth Required | Functionality |
| --- | --- | --- | --- |
| `POST` | `/auth/send-otp` | No | Generates a 4-digit OTP for an email, stores/upserts it in MongoDB, and sends it by email. |
| `POST` | `/auth/verify-otp` | No | Verifies an OTP for registration before the user submits the final registration request. |
| `POST` | `/auth/google` | No | Verifies a Google ID token. If the user exists, logs them in. If not, creates a user, creates their root directory, and logs them in. |

#### `POST /auth/send-otp`

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response:

```json
{
  "success": true,
  "message": "OTP sent to user@example.com"
}
```

#### `POST /auth/verify-otp`

Request body:

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

Success response:

```json
{
  "message": "OTP Verified!"
}
```

Common errors:

- `400` with `OTP not found`
- `400` with `OTP expired`
- `400` with `Invalid OTP`

#### `POST /auth/google`

Request body:

```json
{
  "idToken": "google_id_token"
}
```

Success responses:

```json
{ "message": "Logged in" }
```

```json
{ "message": "Account created and Logged in" }
```

This route sets the signed `sid` cookie.

### User Routes

Base path: `/user`

| Method | Route | Auth Required | Functionality |
| --- | --- | --- | --- |
| `POST` | `/user/register` | No | Creates a new user after OTP validation and creates the user's root directory. |
| `POST` | `/user/login` | No | Validates email/password and sends a login OTP. Does not create a session yet. |
| `POST` | `/user/login-verify-otp` | No | Verifies the login OTP, creates a session, and sets the signed `sid` cookie. |
| `GET` | `/user` | Yes | Returns the currently authenticated user's profile information. |
| `POST` | `/user/logout` | Session cookie expected | Deletes the current session and clears the cookie. |
| `POST` | `/user/logout-all` | Session cookie expected | Deletes all sessions for the current user and clears the cookie. |

#### `POST /user/register`

Request body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "otp": "1234"
}
```

Success response:

```json
{
  "message": "User Registered"
}
```

Registration also creates a root directory named:

```text
root-user@example.com
```

Common errors:

- `400` with `Invalid or Expired OTP!`
- `400` with invalid input details
- `409` when the email already exists

#### `POST /user/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Success response:

```json
{
  "message": "OTP sent to your email"
}
```

Common error:

```json
{ "error": "Invalid Credentials" }
```

#### `POST /user/login-verify-otp`

Request body:

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

Success response:

```json
{
  "message": "Login successful"
}
```

This route sets the signed `sid` cookie. The server keeps a maximum of two sessions per user by deleting the oldest saved session when needed.

#### `GET /user`

Success response:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "picture": "profile_picture_url_or_data"
}
```

#### `POST /user/logout`

Deletes the current session and clears the `sid` cookie.

Success response:

```text
204 No Content
```

#### `POST /user/logout-all`

Deletes all sessions for the current user and clears the `sid` cookie.

Success response:

```text
204 No Content
```

### Directory Routes

Base path: `/directory`

All directory routes require authentication.

| Method | Route | Functionality |
| --- | --- | --- |
| `GET` | `/directory` | Gets the authenticated user's root directory contents. |
| `GET` | `/directory/:id` | Gets a specific directory's metadata, child files, and child directories. |
| `POST` | `/directory` | Creates a directory inside the user's root directory. |
| `POST` | `/directory/:parentDirId` | Creates a directory inside a specific parent directory. |
| `PATCH` | `/directory/:id` | Renames a directory. |
| `DELETE` | `/directory/:id` | Deletes a directory recursively, including nested directories and files. |

Route parameters named `id` and `parentDirId` are validated as MongoDB ObjectIds.

#### `GET /directory` or `GET /directory/:id`

Success response:

```json
{
  "_id": "directory_id",
  "name": "Folder Name",
  "parentDirId": null,
  "userId": "user_id",
  "files": [
    {
      "_id": "file_id",
      "id": "file_id",
      "name": "example.pdf",
      "extension": ".pdf",
      "parentDirId": "directory_id",
      "userId": "user_id"
    }
  ],
  "directories": [
    {
      "_id": "child_directory_id",
      "id": "child_directory_id",
      "name": "Child Folder",
      "parentDirId": "directory_id",
      "userId": "user_id"
    }
  ]
}
```

Common error:

```json
{ "error": "Directory not found or you do not have access to it!" }
```

#### `POST /directory` or `POST /directory/:parentDirId`

Request headers:

```text
dirname: New Folder
```

If `dirname` is not provided, the server uses:

```text
New Folder
```

Success response:

```json
{
  "message": "Directory Created!"
}
```

#### `PATCH /directory/:id`

Request body:

```json
{
  "newDirName": "Renamed Folder"
}
```

Success response:

```json
{
  "message": "Directory Renamed!"
}
```

#### `DELETE /directory/:id`

Deletes the directory, its nested directories, all file records, and the corresponding physical files from `server/storage`.

Success response:

```json
{
  "message": "Files deleted successfully"
}
```

### File Routes

Base path: `/file`

All file routes require authentication.

| Method | Route | Functionality |
| --- | --- | --- |
| `GET` | `/file/:id` | Opens or streams the file in the browser. |
| `GET` | `/file/:id?action=download` | Downloads the file using its stored display name. |
| `POST` | `/file` | Uploads a file into the user's root directory. |
| `POST` | `/file/:parentDirId` | Uploads a file into a specific directory. |
| `PATCH` | `/file/:id` | Renames a file record. |
| `DELETE` | `/file/:id` | Deletes a file record and removes the physical file from storage. |

Route parameters named `id` and `parentDirId` are validated as MongoDB ObjectIds.

#### `GET /file/:id`

Returns the physical file from:

```text
server/storage/{fileId}{extension}
```

If `?action=download` is provided, Express sends the file as an attachment using the saved file name.

Common error:

```json
{ "error": "File not found!" }
```

#### `POST /file` or `POST /file/:parentDirId`

Request headers:

```text
filename: example.pdf
```

Request body:

```text
Raw file bytes
```

The server stores metadata in MongoDB and writes the file to `server/storage` with the generated file ID plus the original extension.

Success response:

```json
{
  "message": "File Uploaded"
}
```

#### `PATCH /file/:id`

Request body:

```json
{
  "newFilename": "renamed.pdf"
}
```

Success response:

```json
{
  "message": "Renamed"
}
```

#### `DELETE /file/:id`

Deletes the file document and removes the physical file from `server/storage`.

Success response:

```json
{
  "message": "File Deleted Successfully"
}
```

## Database Models

### User

- `name`: required string, minimum 3 characters.
- `email`: required unique string, validated with an email pattern.
- `password`: hashed with bcrypt when saved.
- `picture`: profile image URL or default image data.
- `rootDirId`: ObjectId reference to the user's root directory.

### Directory

- `name`: required string.
- `userId`: owner user ID.
- `parentDirId`: parent directory ID or `null` for root.

### File

- `name`: display file name.
- `extension`: file extension from the uploaded file name.
- `userId`: owner user ID.
- `parentDirId`: containing directory ID.

### Session

- `userId`: authenticated user ID.
- `createdAt`: date with a TTL index.

### OTP

- `email`: unique email address.
- `otp`: 4-digit OTP string.
- `createdAt`: expires after 10 minutes.

## Storage Behavior

Uploaded files are saved in:

```text
server/storage/
```

Physical file names use this format:

```text
{fileObjectId}{extension}
```

For example, if the uploaded file is `report.pdf` and MongoDB creates file ID `64abc...`, the physical file is stored as:

```text
server/storage/64abc....pdf
```

The original display name is kept in MongoDB.

## Important Implementation Notes

- The API server listens on port `4000`.
- The Vite client is expected on port `5173`.
- Directory and file API routes require a valid signed `sid` cookie.
- File uploads use raw request bodies piped directly into a file stream.
- Directory deletion is recursive.
- OTP records expire after 10 minutes.
- The frontend currently uses hardcoded `http://localhost:4000` API URLs.
- MongoDB collection validation setup exists in `server/config/setup.js`.

## Useful Commands

Run the server:

```bash
cd server
npm run dev
```

Run the client:

```bash
cd client
npm run dev
```

Build the client:

```bash
cd client
npm run build
```

Lint the client:

```bash
cd client
npm run lint
```
