# PostgreSQL Database Setup

This guide explains how to set up and manage PostgreSQL with Docker/Podman in your Next.js project.

## Prerequisites

- Docker or Podman Desktop installed
- Pod Manager extension for VSCode (optional but recommended)

## Quick Start

1. **Start the PostgreSQL container:**

   ```bash
   pnpm db:start
   ```

2. **Verify the container is running:**

   ```bash
   pnpm db:logs
   ```

3. **Connect to the database (optional):**
   ```bash
   pnpm db:shell
   ```

## Available Commands

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm db:start`   | Start PostgreSQL container in background |
| `pnpm db:stop`    | Stop PostgreSQL container                |
| `pnpm db:down`    | Stop and remove PostgreSQL container     |
| `pnpm db:restart` | Restart PostgreSQL container             |
| `pnpm db:logs`    | View PostgreSQL container logs           |
| `pnpm db:shell`   | Open PostgreSQL shell                    |

## Configuration

### Environment Variables

The database connection is configured in `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nextjs_db"
```

### Docker Compose

The PostgreSQL setup is defined in `docker-compose.yml`:

- **Database:** `nextjs_db`
- **User:** `postgres`
- **Password:** `postgres`
- **Port:** `5432`
- **Container Name:** `nextjs-postgres`

### Database Initialization

When the container starts for the first time, it runs `scripts/init-db.sql` which:

- Creates a `users` table for testing
- Inserts a sample user record
- Sets up basic indexes

## Using with Podman Desktop

1. Open Podman Desktop
2. Go to Containers
3. You should see `nextjs-postgres` container
4. Use the Pod Manager extension in VSCode for additional management features

## Connecting from Your Application

The database URL is already configured in your environment. You can use any PostgreSQL client library like:

- `pg` (node-postgres)
- `prisma`
- `drizzle`
- `typeorm`

Example with `pg`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Example query
const result = await pool.query('SELECT * FROM users');
```

## Troubleshooting

### Container Won't Start

1. Check if port 5432 is already in use:

   ```bash
   netstat -an | grep 5432
   ```

2. Stop other PostgreSQL instances or change the port in `docker-compose.yml`

### Connection Issues

1. Verify the container is running:

   ```bash
   pnpm db:logs
   ```

2. Check the DATABASE_URL in `.env.local`

3. Test connection manually:
   ```bash
   pnpm db:shell
   \l  # List databases
   ```

### Data Persistence

Database data is stored in a Docker volume `postgres_data`. To reset the database:

```bash
pnpm db:down
# Remove volume if needed
docker volume rm nextjs-15-boilerplate_postgres_data
pnpm db:start
```

## Security Notes

⚠️ **Development Only Configuration**

This setup uses default PostgreSQL credentials for development convenience. For production:

1. Change the default password
2. Use environment variables for credentials
3. Consider using connection pooling
4. Implement proper authentication

## Next Steps

- Install a database ORM/ODM (Prisma, Drizzle, etc.)
- Create database migrations
- Set up database testing
- Configure connection pooling for production

## Support

If you encounter issues:

1. Check container logs: `pnpm db:logs`
2. Verify Docker/Podman is running
3. Ensure port 5432 is available
4. Check firewall settings
