# Sports Data Aggregator

This is a full-stack application that fetches sports news articles from RSS feeds, processes them using AI for classification and sentiment analysis, and displays them in a user-friendly interface. The application is built with React, Vite, and ShadCN on the frontend, and Supabase for the backend, including a Postgres database and Deno-based Edge Functions.

## Features

-   User authentication (Sign up/Login).
-   Add and manage RSS feed sources.
-   Manual ingestion trigger for each source.
-   Automatic AI-powered analysis of articles for:
    -   Content Moderation
    -   Categorisation (News, Opinion, Banter)
    -   Sentiment Analysis (Positive, Negative, Neutral)
    -   Extraction of mentioned football teams.
-   A filterable, Adjustable and sortable table to view all processed articles.

---

## Local Development Setup

Follow these steps to get the project running on your local machine.

### Prerequisites

-   Node.js (v18 or later)
-   npm (or yarn/pnpm)
-   [Supabase CLI](https://supabase.com/docs/guides/cli)
-   [Docker](https://www.docker.com/products/docker-desktop/) (must be running)

### 1. Backend Setup (Supabase)

The backend is managed by the Supabase CLI.

1.  **Navigate to the project root directory.**

2.  **Start the local Supabase services:**
    This command spins up the entire Supabase stack in local Docker containers.

    ```shell
    npx supabase start
    ```

    After it starts, the CLI will output your local Supabase credentials, including the `API URL`, `anon key`, `service_role key`, and `JWT secret`. You will need these for the next steps.

3.  **Set up environment variables for Edge Functions:**
    Create a file `supabase/functions/.env` and add the following variables. Replace placeholders with the values from the `npx supabase start` output.

    ```env
    challenges\sports-data-app\supabase\functions\.env
    SUPABASE_URL=http://127.0.0.1:54321
    SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
    LOCAL_JWT_SECRET=<your-jwt-secret>
    OPENAI_API_KEY=<your-openai-api-key>
    ```

4.  **Apply database migrations:**
    This command will execute the SQL schema in `supabase/migrations` to set up your local database tables.

    ```shell
    npx supabase db reset
    ```

5.  **Run the Edge Functions locally:**
    This command serves your Deno-based functions, allowing the frontend to call them.

    ```shell
    npx supabase functions serve 
    ```

### 2. Frontend Setup (React Client)

1.  **Navigate to the client directory:**

    ```shell
    cd client
    ```

2.  **Install dependencies:**

    ```shell
    npm install
    ```

3.  **Set up environment variables for the client:**
    Create a file `client/.env.local` and add your Supabase URL and anon key.

    ```env
    challenges\sports-data-app\client\.env.local
    VITE_SUPABASE_URL=http://127.0.0.1:54321
    VITE_SUPABASE_ANON_KEY=<your-anon-key>
    ```

4.  **Start the React development server:**

    ```shell
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

### Stopping Local Development

To stop all local Supabase services, run the following command from the project root:

```shell
npx supabase stop


