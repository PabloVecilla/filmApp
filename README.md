# FilmApp

[![Backend CI](https://github.com/PabloVecilla/filmApp/actions/workflows/backend-ci.yaml/badge.svg?branch=main)](https://github.com/PabloVecilla/filmApp/actions/workflows/backend-ci.yaml)

![FilmApp banner](./public/img/banner.png)

FilmApp is a full-stack movie discovery and management application. Users can search for films, inspect movie details, and maintain a personal favorites list. Administrators can manage locally stored films and application users.

The project combines PostgreSQL and MongoDB: PostgreSQL stores users and favorites through Sequelize, while MongoDB stores the local film catalogue through Mongoose. Movie searches use the OMDb API and fall back to MongoDB when OMDb does not return a result.

> This is a learning and portfolio project under active development. The repository includes database migrations, Docker-based integration testing, and continuous integration with GitHub Actions.

## Highlights

- Register and log in using JWT authentication and HTTP-only cookies.
- Hash passwords with bcrypt before storing them.
- Search OMDb by title, IMDb identifier, or search term.
- Normalize OMDb and MongoDB films into a shared response format.
- Fall back to the local MongoDB catalogue when OMDb has no matching result.
- Display a randomized selection of OMDb films on the home page.
- Save OMDb or MongoDB films to a user-owned favorites list.
- Prevent users from reading or deleting another user's favorites.
- Prevent duplicate favorites through a PostgreSQL composite unique index.
- Manage MongoDB films through administrator-only endpoints.
- Manage PostgreSQL users through administrator-only endpoints.
- Render the browser interface with EJS, vanilla JavaScript, and CSS.
- Document the API through OpenAPI and Swagger UI.
- Manage the PostgreSQL schema with reversible Sequelize CLI migrations.
- Run PostgreSQL- and MongoDB-backed integration tests with Jest and Supertest.
- Run migrations and tests automatically in GitHub Actions.

## Tech stack

| Area | Technology |
|---|---|
| Runtime | Node.js 22 |
| Web framework | Express 5 |
| Server-rendered UI | EJS |
| Browser code | HTML, CSS, and vanilla JavaScript |
| Relational database | PostgreSQL 16 |
| SQL ORM | Sequelize 6 |
| SQL schema management | Sequelize CLI migrations |
| Document database | MongoDB 7 |
| MongoDB ODM | Mongoose 8 |
| Authentication | JSON Web Tokens and HTTP-only cookies |
| Password security | bcryptjs |
| External movie data | OMDb API and Axios |
| API security | Helmet and express-rate-limit |
| Testing | Jest and Supertest |
| Local test infrastructure | Docker Compose |
| API documentation | OpenAPI and Swagger UI |
| Continuous integration | GitHub Actions |

## Architecture

FilmApp exposes both browser views and JSON API endpoints through one Express application.

```text
Browser or API client
        │
        ▼
Express routes
        │
        ├──► JWT authentication and admin authorization
        ├──► rate limiting and security middleware
        │
        ▼
Controllers
        │
        ├──► Sequelize ──► PostgreSQL
        │                  ├── users
        │                  └── favorites
        │
        ├──► Mongoose ───► MongoDB
        │                  └── films
        │
        └──► Axios ──────► OMDb API
```

`src/app.js` configures Express and exports the application for Supertest. `src/server.js` connects to PostgreSQL and MongoDB before opening the HTTP server.

### Project structure

```text
filmApp/
├── .github/
│   └── workflows/
│       └── backend-ci.yaml       # GitHub Actions CI workflow
├── config/
│   ├── db_mongo.js               # Environment-aware MongoDB connection
│   └── db_pg.js                  # Sequelize runtime and CLI configuration
├── docs/
│   ├── generate-openapi.js
│   ├── openapi.yaml
│   └── postman.json
├── migrations/
│   └── 20261011142846-initial-schema.js
├── public/
│   ├── css/
│   ├── img/
│   ├── js/
│   └── utils/
├── src/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── views/
│   ├── app.js                    # Express configuration
│   └── server.js                 # Database connection and HTTP startup
├── tests/
│   ├── auth.test.js
│   ├── favorites.test.js
│   ├── films.test.js
│   ├── setup.js
│   └── smoke.test.js
├── docker-compose.test.yml       # Disposable PostgreSQL and MongoDB tests
├── jest.config.js
├── .env.example
├── .env.test.example
└── package.json
```

## Data model

```text
PostgreSQL

User 1 ─────────────── * Favorite
                           │
                           ├── movieSource: "omdb"
                           │   └── movieSourceId: IMDb identifier
                           │
                           └── movieSource: "mongo"
                               └── movieSourceId: MongoDB ObjectId


MongoDB

Film
├── title
├── poster
├── year
├── director
├── genre
├── runtime
├── plot
├── actors
└── rating
```

### PostgreSQL

PostgreSQL stores:

- User identity, password hash, and role.
- Favorite ownership and external movie references.
- A unique favorite constraint across `user_id`, `movie_source`, and `movie_source_id`.
- A cascading relationship that deletes a user's favorites when the user is deleted.

The PostgreSQL schema is created and updated exclusively through Sequelize CLI migrations.

### MongoDB

MongoDB stores films created through the administrator interface. Mongoose validates film documents when they are created or updated.

MongoDB does not use Sequelize-style migrations in this project. Collections are created when documents are first written.

## Movie search flow

1. An authenticated user searches with `t`, `i`, or `s`.
2. FilmApp sends the query to OMDb.
3. Successful OMDb results are normalized into the application's film format.
4. If OMDb reports no result, FilmApp searches the MongoDB catalogue.
5. If neither source returns a film, the API responds with `404`.
6. Favorites retain the source and source-specific identifier so FilmApp can resolve the film later.

Accepted search parameters:

| Parameter | Purpose |
|---|---|
| `t` | Search for a film by title |
| `i` | Search for a film by IMDb identifier |
| `s` | Search for multiple films by search term |

Example:

```text
GET /api/films?t=The%20Matrix
```

## Getting started

### Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL 16
- MongoDB 7
- An OMDb API key
- Docker Desktop if you want to run the isolated test environment

### 1. Clone and install

```bash
git clone https://github.com/PabloVecilla/filmApp.git
cd filmApp
npm ci
```

### 2. Configure the application environment

Create the development environment file:

```bash
cp .env.example .env
```

Populate it with your own values:

```env
NODE_ENV=development
PORT=3000

POSTGRES_URI=postgres://filmapp:filmapp@127.0.0.1:5432/filmapp
MONGO_URI=mongodb://127.0.0.1:27017/filmapp

# Set true only when the PostgreSQL provider requires SSL.
DB_SSL=false

OMDB_API_KEY=replace_with_your_omdb_key
ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
```

Never commit `.env`, `.env.test`, production credentials, or real API keys.

### 3. Start local databases

If PostgreSQL and MongoDB are not already available, they can be started with Docker:

```bash
docker run --name filmapp-postgres \
  -e POSTGRES_USER=filmapp \
  -e POSTGRES_PASSWORD=filmapp \
  -e POSTGRES_DB=filmapp \
  -p 5432:5432 \
  -d postgres:16-alpine
```

```bash
docker run --name filmapp-mongo \
  -p 27017:27017 \
  -d mongo:7
```

These development databases are separate from the disposable test databases defined in `docker-compose.test.yml`.

### 4. Apply PostgreSQL migrations

```bash
npm run db:migrate
```

Check the migration state with:

```bash
npm run db:migrate:status
```

Do not use `sequelize.sync()` to manage deployed schemas. All PostgreSQL schema changes should be represented by migrations.

### 5. Start the application

Development mode with automatic restart:

```bash
npm run dev
```

Standard startup:

```bash
npm start
```

The application is available at:

```text
http://localhost:3000
```

Useful entry points:

```text
http://localhost:3000/home
http://localhost:3000/login
http://localhost:3000/signup
http://localhost:3000/docs
http://localhost:3000/health
```

## Administrator access

Public registration always creates a user with the `user` role. It does not accept an administrator role from the request body.

To test administrator functionality in a controlled local environment, promote an existing user directly in PostgreSQL:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Log in again after changing the role so the new JWT contains the updated authorization information.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the application with Node's watch mode |
| `npm start` | Start the application normally |
| `npm test` | Run the complete isolated Docker test workflow |
| `npm run test:jest` | Run Jest directly against already-running test databases |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest and generate coverage |
| `npm run test:db:up` | Start PostgreSQL and MongoDB test services in the background |
| `npm run test:db:down` | Remove test containers, networks, and database volumes |
| `npm run test:docker` | Run migrations and Jest inside Docker |
| `npm run test:docker:clean` | Remove all Docker test resources and persisted test data |
| `npm run test:docker:fresh` | Delete existing test resources and start a fresh test run |
| `npm run db:migrate` | Apply pending development migrations |
| `npm run db:migrate:status` | Show migration status for the selected environment |
| `npm run db:migrate:undo` | Revert the latest migration |
| `npm run db:migrate:test` | Apply pending test migrations |
| `npm run db:migrate:test:undo` | Revert the latest test migration |
| `npm run db:migrate:test:reset` | Revert and reapply all test migrations |
| `npm run db:migrate:production` | Apply pending production migrations |
| `npm run docs` | Generate the OpenAPI document from the Postman collection |

Migration undo and reset commands modify the selected database. Confirm the active environment before using them.

## Browser routes

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Redirect to `/home` |
| `GET` | `/home` | Public | Render the home page |
| `GET` | `/login` | Public | Render the login page |
| `GET` | `/signup` | Public | Render the registration page |
| `GET` | `/dashboard` | Authenticated | Render the movie dashboard |
| `GET` | `/search/:imdbID` | Authenticated | Render a movie detail page |
| `GET` | `/favorites` | Authenticated | Render the user's favorites |
| `GET` | `/admin-movies` | Administrator | Render local film management |
| `GET` | `/admin-users` | Administrator | Render user management |

## API reference

All protected routes require the `accessToken` cookie.

### System

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Check PostgreSQL connectivity and return status information |
| `GET` | `/docs` | Public | Open the Swagger UI documentation |

The current health endpoint checks PostgreSQL. MongoDB connectivity is verified during server startup and test setup.

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/signup` | Public | Register a normal user |
| `POST` | `/api/login` | Public, rate-limited | Authenticate and set the JWT cookie |
| `POST` | `/api/logout` | Public | Clear the authentication cookie and redirect home |

Register:

```json
{
  "name": "Carla",
  "email": "carla@example.com",
  "password": "TestUser1!"
}
```

Login:

```json
{
  "email": "carla@example.com",
  "password": "TestUser1!"
}
```

### Users

All user-management endpoints require administrator authorization.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Administrator | List users without password hashes |
| `GET` | `/api/user/:id` | Administrator | Get one user without their password hash |
| `PUT` | `/api/user/:id` | Administrator | Update a user's role |
| `DELETE` | `/api/user/:id` | Administrator | Delete a user and cascade their favorites |

Update a role:

```json
{
  "role": "admin"
}
```

### Films

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/films?t=:title` | Authenticated | Search by title |
| `GET` | `/api/films?i=:imdbID` | Authenticated | Search by IMDb identifier |
| `GET` | `/api/films?s=:term` | Authenticated | Search for multiple films |
| `GET` | `/api/films/random` | Public | Return up to twelve randomized OMDb films |
| `GET` | `/api/films/admin` | Administrator | List locally stored MongoDB films |
| `GET` | `/api/films/admin/:id` | Administrator | Get one MongoDB film |
| `POST` | `/api/films` | Administrator | Create a MongoDB film |
| `PUT` | `/api/films/:id` | Administrator | Update accepted fields on a MongoDB film |
| `DELETE` | `/api/films/:id` | Administrator | Delete a MongoDB film |

Create a local film:

```json
{
  "title": "Example Film",
  "poster": "https://example.com/poster.jpg",
  "year": 2024,
  "director": "Example Director",
  "genre": "Acción",
  "runtime": 120,
  "plot": "An example locally stored film.",
  "actors": [
    "Actor One",
    "Actor Two"
  ],
  "rating": []
}
```

### Favorites

Favorite ownership always comes from the authenticated JWT. A client-supplied `userId` is ignored.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/favorites` | Authenticated | Return the current user's resolved favorites |
| `POST` | `/api/favorites` | Authenticated | Add an OMDb or MongoDB favorite |
| `DELETE` | `/api/favorites/:id` | Authenticated owner | Delete an owned favorite |

Add an OMDb favorite:

```json
{
  "movieSource": "omdb",
  "movieSourceId": "tt0133093"
}
```

Add a MongoDB favorite:

```json
{
  "movieSource": "mongo",
  "movieSourceId": "507f1f77bcf86cd799439011"
}
```

Adding an existing favorite returns the existing record instead of creating a duplicate.

## Authentication behavior

Successful login sets a cookie named `accessToken` with these properties:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- Twenty-minute expiration

Browser requests to protected routes must include credentials. Requests made from the same origin include the cookie automatically.

The JWT contains the user's ID, name, email, and role. Administrator authorization is determined from the role in the token, so users should log in again after an administrator changes their role.

## Testing

### Complete isolated test run

The simplest option is:

```bash
npm test
```

This command:

1. Starts PostgreSQL 16 and MongoDB 7 in Docker.
2. Waits until both services are healthy.
3. Installs dependencies inside the test runner.
4. Applies the Sequelize test migration.
5. Runs Jest serially.
6. Returns the Jest exit code.
7. Stops the service containers when the test runner exits.

Remove containers, networks, test dependencies, and database volumes afterward:

```bash
npm run test:docker:clean
```

### Development test workflow

For cleaner Jest output and faster repeated test runs:

```bash
cp .env.test.example .env.test
npm run test:db:up
npm run db:migrate:test
npm run test:jest
```

Keep the databases running while developing and rerun:

```bash
npm run test:jest
```

or:

```bash
npm run test:watch
```

When finished:

```bash
npm run test:db:down
```

Never point `POSTGRES_URI_TEST` or `MONGO_URI_TEST` at development or production databases. The Jest setup deletes test data between cases.

### Current test coverage

The integration suite currently covers:

- PostgreSQL and application health.
- JSON `404` behavior for unknown API routes.
- User registration success and validation failures.
- Duplicate account prevention.
- Cookie-authenticated favorite reads, creation, deduplication, and deletion.
- Favorite ownership isolation between users.
- Missing film behavior for stored favorites.
- OMDb title and collection searches with mocked external responses.
- MongoDB fallback when OMDb returns no result.
- Random movie responses and OMDb failure handling.
- Administrator film listing, retrieval, creation, update, and deletion.
- Administrator-route rejection for normal and unauthenticated users.

The suite currently contains 38 integration tests across authentication, films, favorites, and smoke behavior. Tests run serially because they share disposable database state.

A dedicated test suite for the user-management controller remains to be added.

## Continuous integration

GitHub Actions runs `Backend CI` for:

- Pushes to `main`.
- Pushes to `develop`.
- Pull requests targeting `main`.
- Pull requests targeting `develop`.

The workflow:

1. Starts isolated PostgreSQL 16 and MongoDB 7 services.
2. Installs dependencies with `npm ci`.
3. Fails on high or critical production dependency vulnerabilities.
4. Applies the Sequelize test migration.
5. Runs the Jest integration suite.

The required status-check name is:

```text
Migrations and tests
```

Repository rules should require this check before pull requests can merge into `main` or `develop`.

This repository currently implements continuous integration. Deployment remains provider-specific; there is no deployment workflow committed to this repository.

## Deployment contract

A deployment environment needs:

- `NODE_ENV=production`
- `PORT`
- `POSTGRES_URI`
- `MONGO_URI`
- `DB_SSL=true` when required by the PostgreSQL provider
- `OMDB_API_KEY`
- A strong `ACCESS_TOKEN_SECRET`

Recommended deployment phases:

```text
Install: npm ci
Release: npm run db:migrate:production
Start:   npm start
```

Run migrations once as a release step before starting or replacing application instances. Do not run `sequelize.sync()` in production.

The application binds to `0.0.0.0` when `NODE_ENV=production`.

## Security decisions

- Passwords are hashed before persistence.
- Password hashes are excluded from user-management responses.
- Public registration always creates the `user` role.
- JWTs are stored in HTTP-only cookies.
- Protected API routes reject missing, invalid, or expired tokens.
- Administrator routes require an `admin` role in the verified JWT.
- Favorite queries and deletions are scoped to the authenticated user.
- Duplicate favorites are prevented at the database level.
- Login requests have a dedicated rate limiter.
- The application has a global rate limiter.
- Helmet supplies standard HTTP security headers and a content security policy.
- Test configuration refuses to use a test URI that exactly matches a configured production URI.
- GitHub Actions receives test-only secrets and isolated databases.

## Current status and roadmap

The principal application flow is implemented:

1. A user registers and logs in.
2. The user searches OMDb or the local MongoDB catalogue.
3. Search results are normalized into a shared format.
4. The user opens film details and saves favorites.
5. Administrators manage local films and application users.

Current priorities include:

- Add integration tests for the user-management controller.
- Correct and validate administrator role updates.
- Centralize OMDb requests, timeouts, and sanitized error handling.
- Ensure every OMDb request uses HTTPS.
- Replace dynamic browser `innerHTML` rendering with safe DOM construction.
- Expand health checks to distinguish liveness from PostgreSQL and MongoDB readiness.
- Add graceful shutdown for HTTP, Sequelize, and Mongoose connections.
- Remove internal error details from production responses.
- Review and update dependencies reported by `npm audit`.
- Add linting and static analysis to CI.
- Define a provider-specific deployment workflow and rollback procedure.

## Screenshots

| Dashboard | Film details |
|---|---|
| ![FilmApp dashboard](./public/img/home.png) | ![FilmApp film detail](./public/img/details.png) |

## API documentation

Start the application and open:

```text
http://localhost:3000/docs
```

The source OpenAPI document is stored in:

```text
docs/openapi.yaml
```

The repository also includes a Postman collection at:

```text
docs/postman.json
```

## Contributing workflow

The CI workflow targets both `develop` and `main`.

Create feature branches from `develop`:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feat/short-description
```

Before opening a pull request:

```bash
npm test
```

Keep commits focused, include a migration for every PostgreSQL schema change, update tests when behavior changes, and never commit real environment files or credentials.

Recommended flow:

```text
feature branch
    │
    ▼
pull request into develop
    │
    ▼
required "Migrations and tests" check
    │
    ▼
develop
    │
    ▼
release pull request into main
    │
    ▼
required "Migrations and tests" check
    │
    ▼
main
```

## Authors

- Jaime Rubio
- Pablo Vecilla
- Antonio Soler
- Elena González

## License

The package currently declares the ISC license. Add a root `LICENSE` file before publishing or distributing the project as an open-source package.