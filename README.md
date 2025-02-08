# Crewmates

## Configuration for use

### Config files / environment variables

- Environment variables - backend: `src/backend/.env`

  ```env
  PORT=3200
  BETTER_AUTH_SECRET=some-secret
  BETTER_AUTH_URL=http://localhost:3200
  DATABASE_URL="postgresql://postgres:docker@localhost:5432/crewmates?schema=public"
  GITHUB_CLIENT_ID=your-client-id
  GITHUB_CLIENT_SECRET=your-client-secret
  ```

  Generate a secret: `npx @better-auth/cli@latest secret`

  Obtain GitHub client credentials [here](https://github.com/settings/developers)

- CORS config: `src/backend/src/config/index.ts`

  ```ts
  export const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:4173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  ```

- Environment variables - frontend: `src/frontend/.env`

  ```env
  VITE_API_URL=http://localhost:3200
  VITE_BASE_URL=http://localhost:5173
  ```

### Initialize the database

Run the following commands to initialize the database (first time setup only)

```bash
yarn install
docker run --name crewmates -e POSTGRES_PASSWORD=docker -p 5432:5432 -d postgres
docker exec -ti crewmates psql -U postgres -c "CREATE DATABASE crewmates;"
yarn prisma:reset
```
