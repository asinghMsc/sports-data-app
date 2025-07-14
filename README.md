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


# Database Schema and Application Logic

---

## Database Schema

The database schema is defined in `supabase/migrations/20250709153000_initial_schema.sql` and consists of three main tables:

### `profiles`

This table stores profile information for users. It is automatically populated by a database trigger (defined in the migration file) when a new user signs up via Supabase Auth.

*   **`id`** (uuid, PK, FK): A unique identifier for the profile, linked directly to the `auth.users` table.
*   **`email`** (text): The user's email address.

### `sources`

This table stores the RSS feed sources added by users. Each source is linked to a specific user profile via the `user_id`.

*   **`id`** (uuid, PK): A unique identifier for the source.
*   **`url`** (text, unique): The URL of the RSS feed.
*   **`name`** (text): A user-friendly name for the source.
*   **`last_crawled_at`** (timestamptz): Timestamp of the last time the feed was ingested.
*   **`user_id`** (uuid, FK): A foreign key referencing the `id` in the `profiles` table, indicating which user added the source.

### `articles`

This table stores individual articles fetched from the RSS feeds.

*   **`id`** (uuid, PK): A unique identifier for the article.
*   **`source_id`** (uuid, FK): A foreign key referencing the `id` in the `sources` table.
*   **`title`** (text): The title of the article.
*   **`link`** (text, unique): The direct URL to the original article.
*   **`published_at`** (timestamptz): The publication date of the article.
*   **`content`** (text): The main content or description of the article.
*   **`category`** (text): The AI-determined category (e.g., 'News', 'Opinion', 'Banter').
*   **`sentiment`** (text): The AI-determined sentiment (e.g., 'Positive', 'Negative', 'Neutral').
*   **`teams_mentioned`** (jsonb): A JSON array of football team names mentioned.
*   **`is_flagged`** (boolean): `true` if the content was flagged by OpenAI's moderation endpoint.

---

-   **RLS Troubleshooting**: If you encounter issues adding sources after setting up user authentication, Row Level Security (RLS) on the `sources` table might be preventing inserts. You can temporarily disable RLS for testing by connecting to your local Supabase database and running `alter table public.sources disable row level security;`. Re-enable it afterwards with `alter table public.sources enable row level security;`.

## Application Logic

The core logic of the application is orchestrated by two Supabase Edge Functions.

### 1. `ingest-rss-feed`

This function is responsible for fetching and storing articles from a given RSS feed URL.

*   **Trigger**: Manually triggered by an authenticated user from the frontend 'Ingest Now' button.
*   **Process**:
    1.  Receives an RSS `url` and `sourceId` from the client.
    2.  Uses the third-party `rss2json.com` API to convert the XML RSS feed into a structured JSON format.
    3.  Iterates through the articles in the JSON response.
    4.  For each article, it inserts a new record into the `articles` table in the database. It skips duplicates based on the unique `link`.
    5.  For every newly inserted article, it asynchronously invokes the `process-article-ai` function to perform AI analysis.
    6.  Updates the `last_crawled_at` timestamp on the source.

### 2. `process-article-ai`

This function performs AI-based analysis on the content of a single article.

*   **Trigger**: Invoked by the `ingest-rss-feed` function after a new article is saved.
*   **Process**:
    1.  Receives the `article_id` and `article_content`.
    2.  **Moderation**: First, it sends the article content to OpenAI's Moderation API. If the content is flagged, `is_flagged` is set to `true`.
    3.  **Classification**: It then uses the OpenAI Chat Completions API (`gpt-4o`) with a specific prompt to analyse the article. The prompt instructs the model to return a JSON object containing:
        *   `type`: The article category ('News', 'Opinion', or 'Banter').
        *   `sentiment`: The article's sentiment ('Positive', 'Negative', or 'Neutral').
        *   `teams`: A list of all football teams mentioned.
    4.  The function parses the AI's JSON response and updates the corresponding article record in the `articles` table with the new data (`category`, `sentiment`, `teams_mentioned`).