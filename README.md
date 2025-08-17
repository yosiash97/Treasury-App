# Treasury Yield Full Stack App
A full stack application for viewing historical yields & submitting orders.

## Tech Stack
* Frontend: React
* Charts: Recharts for yield visualization
* Backend: NestJS/Typescript
* Database: Postgres + Prisma (ORM)

## Design
Given the time I felt that I reached a pretty strong design,
satisfied all requirements and implemented caching since yield data
is static - so no need to repeatedly hit external API for popular requests.

## What would I change/add if infinite time
1. I've installed swagger, but definitely robust api documentation to outline endpoints/requests/responses/etc
2. More robust test coverage
3. Add authentication and apply some type of rules on amount of orders/total $ order amount per user.
4. It'd be cool to use websockets for real time data + allow automatic order execution based on certain user inputs.

## Project Structure

```bash
├── client/          # React frontend
├── server/          # Nest backend
├── package.json     # Root package.json with scripts
└── README.md
```
# Getting Started
1. Install dependencies
   ```bash
   npm run install:all
   ```
2. Setup postgres database
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```
3. Start app
   ```bash
   npm run dev
   ```
4. Run tests(both Jest component & E2E)
   ```bash
   cd server
   npm run test
   npm run test:e2e
   ```
# Postgres Database Setup
1. Generate Prisma Client
   ```bash
   cd server
   npx prisma generate
   ```
3. Apply migrations
   ```bash
   cd server
   npx prisma migrate dev
   ```
3. View server/prisma/schema.prisma to see schema
# Endpoints
1. ```GET /yields``` get all yield data
2. ```POST /orders``` create an order
3. ```GET /orders``` get all created orders for order history component
   


