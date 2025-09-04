# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, update, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

### Tech Stack
-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Auth & Database**: Supabase
-   **Styling**: Tailwind CSS with shadcn/ui
-   **State**: Server Components; Client Components only when interactivity is required

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

---

## Getting Started

### 1. Prerequisites
-   Node.js v20+
-   npm (or yarn/pnpm)
-   A Supabase project (free tier works)

### 2. Supabase Setup
1. Create a project at `https://supabase.com/`.
2. In the SQL editor, create tables `polls` and `votes` similar to:
   - `polls(id uuid primary key default gen_random_uuid(), user_id uuid not null, question text not null, options jsonb not null, created_at timestamptz default now())`
   - `votes(id uuid primary key default gen_random_uuid(), poll_id uuid references polls(id) on delete cascade, user_id uuid, option_index int not null, created_at timestamptz default now())`
3. Recommended: add unique constraint on `votes(poll_id, user_id)` to enforce one vote per user.
4. Optional but recommended: enable RLS with policies restricting writes to owners.

### 3. Environment Variables
Create a `.env.local` file in the project root with your Supabase keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# If you later add server-only actions needing elevated access, load a secret key as well:
# SUPABASE_SECRET_KEY=your_service_role_key
```

### 4. Installation
```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 5. Run the Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`.

---

## Usage Examples

### Register and Login
- Navigate to `/register` to create an account.
- Then login at `/login`.

### Create a Poll
- Go to your dashboard/polls page.
- Enter a question and at least two options.
- Submit to create the poll.

### Vote on a Poll
- Open a poll’s details page.
- Select an option and submit your vote.
- You must be logged in to vote; duplicate votes by the same user are blocked.

### Manage Your Polls
- From your dashboard, you can update the poll’s question/options or delete polls you own.

---

## Testing and Development Notes
- This project uses Server Actions for mutations and Server Components for data fetching where possible.
- Ensure your `.env.local` is present; without it, Supabase calls will fail.
- If you add tests later, a typical flow is:
```bash
# Lint/type-check (if configured)
npm run lint
npm run typecheck
# Run tests (if configured)
npm test
```

---

## Troubleshooting
- 401/redirect loops: confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values.
- Cannot fetch polls: ensure your tables exist and your session is valid.
- Votes not recorded: check the unique constraint and that you are authenticated.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!
