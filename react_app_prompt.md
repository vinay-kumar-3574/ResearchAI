# ResearchAI — Full-Stack React Application Prompt

---

## Problem Statement

- Researchers, students, content creators, and professionals spend an enormous amount of time manually searching for information across multiple websites, reading through dozens of articles, extracting relevant data points, synthesizing their findings into a coherent report, and then self-reviewing or waiting for peer review to validate the quality of their work
- This entire research workflow is fragmented — the user has to switch between search engines, individual web pages, writing tools, and review checklists, losing context and wasting hours on a process that could be intelligently automated
- There is no single platform that takes a research topic as input and automatically performs deep web searching, intelligent content scraping, professional report generation, and critical quality review — all in one seamless pipeline
- Existing tools either do only search (Google), only writing (ChatGPT), or only review (Grammarly) — none of them chain these capabilities together into a unified, multi-agent research pipeline where each stage builds upon the output of the previous stage
- Users have no way to track, save, compare, or revisit their past research sessions, making it impossible to build upon previous work or share structured research with collaborators

---

## Solution

- Build a full-featured React web application called **ResearchAI** that serves as the frontend interface for a multi-agent AI research pipeline powered by LangChain, Groq (Qwen3-32B), and Tavily search
- The application orchestrates four specialized AI agents in sequence:
  - **Search Agent** — Uses Tavily to perform intelligent web searches and returns the most relevant, recent, and reliable results with titles, URLs, and content snippets
  - **Reader Agent** — Takes the search results, identifies the most relevant URL, and scrapes the full page content for deeper analysis, cleaning out scripts, styles, and navigation elements to extract pure text
  - **Writer Agent** — Receives both the search results and the scraped content, then generates a professionally structured research report with an introduction, key findings (minimum 3 well-explained points), conclusion, and source citations
  - **Critic Agent** — Reviews the generated report and provides a rigorous evaluation with category-wise scores (Clarity, Research Depth, Accuracy, Analysis & Insights, Structure, Source Quality), strengths, weaknesses, missing opportunities, specific improvement suggestions, and a final verdict
- The frontend provides a beautiful, interactive interface where users can initiate research, watch each pipeline stage execute in real-time, view the final report and critique, save their research history, and manage their account

---

## Application Pages & Features

---

### Page 1: Landing Page (Route: `/`)

**Purpose and Context:**
- This is the very first page any visitor sees when they arrive at the ResearchAI platform, and its purpose is to immediately communicate what the product does, why it matters, and how it works, while compelling the visitor to sign up or start using the tool
- This page must be accessible to everyone — both logged-in users and anonymous visitors

**Hero Section:**
- The hero section occupies the prominent top portion of the landing page and serves as the primary attention-grabbing element
- It contains a powerful headline that communicates the core value proposition of ResearchAI — something that conveys the idea of "AI-powered research from search to report in minutes"
- Below the headline, there is a supporting subheadline that briefly explains the four-stage pipeline concept: the platform searches the web, reads and extracts content, writes a professional report, and critically reviews it — all automatically
- There is a prominent call-to-action button labeled "Start Researching" that redirects anonymous users to the signup/login page and redirects authenticated users directly to the research dashboard
- There is a secondary call-to-action button labeled "See How It Works" that smooth-scrolls the user down to the "How It Works" section on the same page
- The hero section also includes an animated or interactive visual representation of the research pipeline — showing data flowing from a search query through the four agents and producing a final reviewed report

**How It Works Section:**
- This section is positioned below the hero and provides a step-by-step breakdown of the entire research pipeline
- It is organized as a vertical or horizontal timeline with four distinct steps, each representing one agent in the pipeline:
  - **Step 1 — Intelligent Search:** The user enters a research topic, and the Search Agent queries Tavily to find the top 5 most relevant and recent web sources, returning titles, URLs, and content previews for each result
  - **Step 2 — Deep Content Extraction:** The Reader Agent analyzes the search results, identifies the most promising URL, navigates to that page, and scrapes the full text content while intelligently removing scripts, styles, navigation bars, and footers to extract only the meaningful content
  - **Step 3 — Professional Report Writing:** The Writer Agent receives all gathered intelligence — both the search snippets and the deeply scraped content — and synthesizes everything into a well-structured research report with a clear introduction, at least three detailed key findings with explanations, a conclusive summary, and a properly formatted list of all source URLs
  - **Step 4 — Critical Quality Review:** The Critic Agent acts as a senior research reviewer, evaluating the report across six dimensions (Clarity, Research Depth, Accuracy, Analysis & Insights, Structure, Source Quality), scoring each out of 10, identifying strengths and weaknesses, pointing out missing opportunities, providing specific actionable improvement suggestions, and delivering a final verdict on the report's quality and readiness
- Each step has a brief description and an icon or illustration that represents the action being performed

**Key Features Section:**
- This section highlights the major capabilities and advantages of the platform in a grid or card layout
- Each feature card contains a feature title and a detailed description explaining what it does and why it matters:
  - **Multi-Agent Intelligence:** The platform uses four specialized AI agents, each fine-tuned for a specific task in the research workflow, rather than relying on a single general-purpose model — this produces significantly better results than asking one AI to do everything
  - **Real-Time Pipeline Tracking:** Users can watch each stage of the research process execute in real-time, with live status updates, progress indicators, and intermediate results displayed as each agent completes its work
  - **Structured Report Generation:** Every report follows a professional academic structure with clear sections, ensuring consistency, readability, and comprehensive coverage of the topic
  - **Rigorous AI Critique:** The critic agent uses a calibrated scoring rubric that avoids inflated scores — reports only receive high marks if they genuinely meet publication-quality standards
  - **Source Transparency:** Every piece of information in the report is traceable back to its source URL, ensuring full transparency and allowing users to verify claims independently
  - **Research History:** All past research sessions are saved and organized, allowing users to revisit, compare, and build upon previous work at any time

**Use Cases Section:**
- This section presents specific scenarios where ResearchAI provides value, helping visitors understand who the product is for
- Each use case is presented as a card or block with a title and a detailed explanation:
  - **Academic Research:** Students and scholars can use the platform to quickly survey a topic, gather credible sources, generate a first draft of their literature review or research summary, and receive automated feedback before submitting to advisors
  - **Content Creation:** Bloggers, journalists, and content marketers can use the platform to research trending topics, extract key data points from multiple sources, and generate well-structured articles backed by credible references
  - **Business Intelligence:** Professionals can research competitors, market trends, emerging technologies, or industry developments and receive a concise, critically reviewed briefing document
  - **Learning & Exploration:** Curious individuals can explore any topic they want to learn about and receive both a comprehensive summary and a quality assessment that tells them how reliable and complete the information is

**Testimonials or Social Proof Section:**
- This section displays user testimonials, usage statistics, or trust indicators that build credibility
- If the platform is new, this can show metrics like "Powered by Groq's Qwen3-32B model" or "Searches 5+ sources per query" or "Reports reviewed across 6 quality dimensions"

**Footer:**
- The footer appears at the bottom of every page including the landing page
- It contains navigation links organized into logical groups:
  - **Product:** Links to How It Works, Features, Pricing (if applicable)
  - **Company:** Links to About Us, Contact, Blog (if applicable)
  - **Legal:** Links to Privacy Policy, Terms of Service
  - **Social:** Links to GitHub repository, Twitter/X, LinkedIn (if applicable)
- It also contains a copyright notice with the current year and the ResearchAI brand name
- There is a small "Back to Top" button that smooth-scrolls the user back to the top of the page

---

### Page 2: Sign Up Page (Route: `/signup`)

**Purpose and Context:**
- This page allows new users to create an account on the ResearchAI platform so they can access the research dashboard, save their research history, and manage their preferences
- This page is only accessible to unauthenticated users — if a logged-in user navigates here, they should be automatically redirected to the dashboard

**Registration Form:**
- The form collects the following information from the user:
  - **Full Name:** A text input field where the user enters their complete name, which will be displayed on their profile and in the dashboard greeting — this field is required and must contain at least 2 characters
  - **Email Address:** A text input field where the user enters their email address, which will serve as their unique login identifier — this field is required, must be a valid email format, and the system should check for duplicate registrations
  - **Password:** A password input field where the user creates their account password — this field is required, must be at least 8 characters long, and should include at least one uppercase letter, one lowercase letter, one number, and one special character — there should be a toggle button to show/hide the password text
  - **Confirm Password:** A second password input field where the user re-enters their password to prevent typos — this field must exactly match the password field, and if they don't match, an inline error message should be displayed immediately
- Below all fields, there is a "Create Account" button that submits the form — this button should be disabled until all validation rules are satisfied
- While the registration is processing, the button should show a loading state to prevent duplicate submissions

**Form Validation:**
- All validation happens in real-time as the user types (not just on submission)
- Each field displays its own inline error message directly below the field when validation fails
- Error messages should be specific and helpful — for example, "Password must include at least one uppercase letter" rather than just "Invalid password"
- The email field should also display an error if the email is already registered in the system

**OAuth / Social Sign Up:**
- Below the form, there is an "OR" divider separating the manual form from social login options
- There are buttons for signing up with Google and GitHub — each button initiates the respective OAuth flow
- When a user signs up via OAuth, their name and email are automatically populated from their social account, and they skip the password creation step entirely

**Navigation Links:**
- Below the form, there is a link that says "Already have an account? Log in" which navigates the user to the Login page
- There is also a link back to the landing page (the ResearchAI logo in the header serves this purpose)

**Post-Registration Flow:**
- After successful registration, the user receives a confirmation message and is automatically redirected to the Login page (or directly to the Dashboard if using auto-login after registration)
- Optionally, the system can send a verification email and require the user to verify their email address before accessing the full dashboard

---

### Page 3: Login Page (Route: `/login`)

**Purpose and Context:**
- This page allows existing users to authenticate and access their research dashboard
- This page is only accessible to unauthenticated users — if a logged-in user navigates here, they should be automatically redirected to the dashboard

**Login Form:**
- The form contains the following fields:
  - **Email Address:** A text input field where the user enters their registered email address — this field is required and validates for proper email format
  - **Password:** A password input field where the user enters their account password — this field is required, and there should be a toggle button to show/hide the password text
- There is a "Remember Me" checkbox that, when checked, persists the user's session for a longer duration (e.g., 30 days) so they don't have to log in every time they visit the platform
- Below the fields, there is a "Log In" button that submits the form — this button shows a loading state while authentication is processing

**Error Handling:**
- If the email is not registered, an error message says "No account found with this email address"
- If the password is incorrect, an error message says "Incorrect password. Please try again."
- After 5 consecutive failed login attempts, the account should be temporarily locked for 15 minutes to prevent brute-force attacks, and the user should see a message explaining this

**Forgot Password Link:**
- Below the password field, there is a "Forgot Password?" link that navigates the user to the Forgot Password page

**OAuth / Social Login:**
- Below the form, there is an "OR" divider separating the manual form from social login options
- There are buttons for logging in with Google and GitHub — these work identically to the signup OAuth flow but for returning users

**Navigation Links:**
- Below the form, there is a link that says "Don't have an account? Sign up" which navigates the user to the Sign Up page

**Post-Login Flow:**
- After successful authentication, the user is redirected to the Research Dashboard
- The user's authentication token is stored securely (in httpOnly cookies or secure localStorage) and included in all subsequent API requests

---

### Page 4: Forgot Password Page (Route: `/forgot-password`)

**Purpose and Context:**
- This page allows users who have forgotten their password to initiate a password reset process

**Email Input:**
- The page contains a single form with one field — the user's registered email address
- There is a "Send Reset Link" button that, when clicked, sends a password reset email to the provided address
- After submission, the page displays a confirmation message: "If an account exists with this email, you will receive a password reset link shortly" — this message is intentionally vague to prevent email enumeration attacks

**Navigation Links:**
- There is a "Back to Login" link that returns the user to the Login page

---

### Page 5: Reset Password Page (Route: `/reset-password/:token`)

**Purpose and Context:**
- This page is accessed via the password reset link sent to the user's email
- The `:token` parameter in the URL is a unique, time-limited token that validates the reset request

**Reset Form:**
- The form contains two fields:
  - **New Password:** With the same validation rules as the signup password field (minimum 8 characters, uppercase, lowercase, number, special character) and a show/hide toggle
  - **Confirm New Password:** Must match the new password field exactly
- There is a "Reset Password" button that submits the new password
- After successful reset, the user sees a confirmation message and is redirected to the Login page

**Token Validation:**
- If the token is expired or invalid, the page displays an error message: "This reset link has expired or is invalid. Please request a new one." with a link back to the Forgot Password page

---

### Page 6: Research Dashboard (Route: `/dashboard`)

**Purpose and Context:**
- This is the primary workspace of the entire application — the central hub where authenticated users initiate new research, monitor pipeline execution, and access all their research-related features
- This page is only accessible to authenticated users — unauthenticated visitors are redirected to the Login page
- The dashboard is designed to be the page users spend the most time on

**Dashboard Header / Top Bar:**
- The top bar is persistent across the dashboard and contains:
  - The ResearchAI logo on the left, which links back to the dashboard home
  - A navigation menu with links to: Dashboard (current page), Research History, Settings/Profile
  - On the right side, there is a user avatar or initials badge showing the logged-in user's name, with a dropdown menu that contains links to Profile Settings, Help/Documentation, and a Logout button
  - The logout button ends the user's session, clears authentication tokens, and redirects to the Login page

**Welcome Section:**
- At the top of the dashboard content area, there is a personalized greeting that addresses the user by their first name (e.g., "Welcome back, Vinay")
- Below the greeting, there is a brief one-line description reminding the user what they can do: "Enter a topic below and let our AI agents research, write, and review a report for you"

**New Research Input Section:**
- This is the most prominent and important section of the dashboard — the starting point for all research
- It contains a large, clearly visible text input field where the user types their research topic (e.g., "Latest advancements in quantum computing 2025")
- The input field has helpful placeholder text that suggests example topics to guide the user
- Next to or below the input field, there is a prominent "Start Research" button that initiates the research pipeline
- When the user clicks "Start Research":
  - The input field and button become disabled to prevent duplicate submissions
  - The pipeline execution section below activates and begins showing real-time progress
  - The system sends the topic to the backend API, which triggers the four-agent pipeline

**Pipeline Execution / Live Progress Section:**
- This section appears below the research input and visualizes the entire research pipeline execution in real-time
- It displays four sequential stages, each representing one agent in the pipeline:
  - **Stage 1 — Search Agent:** Shows a status indicator (waiting / in progress / completed / failed), and once completed, displays a summary of the search results including the number of sources found and a preview of the top result titles and URLs
  - **Stage 2 — Reader Agent:** Shows a status indicator, and once completed, displays a brief preview of the scraped content (first 200-300 characters) along with the URL that was scraped
  - **Stage 3 — Writer Agent:** Shows a status indicator, and once completed, displays a notification that the report has been generated with a "View Full Report" button
  - **Stage 4 — Critic Agent:** Shows a status indicator, and once completed, displays the overall score (e.g., "7.5/10") with a "View Full Critique" button
- Each stage transitions visually from a "waiting" state to "in progress" (with an animation or spinner) to "completed" (with a success indicator) as the pipeline progresses
- If any stage fails, it shows an error state with the error message and a "Retry" button that attempts to re-run from the failed stage
- The stages are connected visually (e.g., with lines or arrows) to emphasize the sequential flow of data from one agent to the next

**Quick Stats / Overview Cards:**
- Below the pipeline section (or in a sidebar), there are summary cards showing the user's usage statistics:
  - **Total Researches:** The total number of research sessions the user has completed
  - **Average Score:** The average critic score across all their research reports
  - **Last Research:** The topic and date of their most recent research session
  - **This Month:** The number of research sessions completed in the current month

**Recent Research Section:**
- At the bottom of the dashboard, there is a section showing the user's 5 most recent research sessions in a list or card format
- Each item displays:
  - The research topic
  - The date and time when the research was conducted
  - The critic's overall score for that research
  - A brief snippet from the report's introduction (first 100-150 characters)
  - A "View Details" button that navigates to the Research Detail page for that specific session
- There is also a "View All History" link that navigates to the full Research History page

---

### Page 7: Research Results / Detail Page (Route: `/research/:id`)

**Purpose and Context:**
- This page displays the complete results of a single research session, including all outputs from every stage of the pipeline
- Users arrive here either by clicking "View Details" from the dashboard or research history, or they are automatically scrolled/redirected here after a pipeline completes
- Each research session has a unique ID, and this page loads the data for that specific session

**Research Header:**
- At the top of the page, there is a header showing:
  - The research topic as the page title
  - The date and time when the research was conducted
  - The overall critic score displayed prominently
  - A "Back to Dashboard" button
  - Action buttons: "Download as PDF," "Share," and "Delete"

**Tabbed Content Area:**
- The main content is organized into tabs so the user can easily switch between different outputs without scrolling through a very long page
- The tabs are:

  **Tab 1 — Search Results:**
  - Displays all the search results returned by the Search Agent
  - Each result is shown as a card or list item with:
    - The page title (clickable, opens the URL in a new tab)
    - The source URL displayed below the title
    - The content snippet (first 500 characters of the content preview)
  - There are up to 5 search results displayed

  **Tab 2 — Scraped Content:**
  - Displays the full scraped content extracted by the Reader Agent
  - Shows the URL that was scraped at the top, with a clickable link to visit the original page
  - The scraped text is displayed in a clean, readable format with proper paragraph spacing
  - If the content is very long, it is displayed in a scrollable container with a "Copy to Clipboard" button

  **Tab 3 — Research Report:**
  - Displays the full research report generated by the Writer Agent
  - The report is rendered with proper markdown formatting, showing:
    - The Introduction section
    - The Key Findings section with numbered or bulleted points, each with detailed explanations
    - The Conclusion section
    - The Sources section listing all URLs found in the research
  - There is a "Copy Report" button that copies the entire report text to the clipboard
  - There is a "Download as PDF" button that exports the report as a formatted PDF document
  - There is an "Export as Markdown" button that downloads the report as a .md file

  **Tab 4 — Critic Review:**
  - Displays the complete critique from the Critic Agent
  - The content is organized into clearly separated sections:
    - **Overall Score:** Displayed prominently with a visual indicator (e.g., a progress bar or gauge) — color-coded based on the score range (low/medium/high)
    - **Category Scores:** Each of the six categories (Clarity, Research Depth, Accuracy, Analysis & Insights, Structure, Source Quality) is displayed with its individual score and a visual bar
    - **Strengths:** Listed as bullet points highlighting what the report did well
    - **Weaknesses:** Listed as bullet points identifying areas where the report falls short
    - **Missing Opportunities:** Listed as bullet points noting topics or angles that were not covered
    - **Specific Improvements:** Numbered list of actionable suggestions to improve the report
    - **Final Verdict:** A 2-3 sentence summary assessment displayed in a highlighted block

**Pipeline Timeline:**
- Below the tabs (or in a sidebar), there is a small timeline showing when each pipeline stage executed:
  - Search completed at [timestamp]
  - Scraping completed at [timestamp]
  - Report generated at [timestamp]
  - Critique completed at [timestamp]
- This gives the user transparency into how long each stage took

---

### Page 8: Research History Page (Route: `/history`)

**Purpose and Context:**
- This page displays a comprehensive, searchable, and filterable list of all research sessions the user has ever conducted
- It serves as the user's research library, allowing them to revisit and compare past work

**Search and Filter Bar:**
- At the top of the page, there is a search input field that allows the user to search their research history by topic keyword
- The search is performed in real-time as the user types (debounced to avoid excessive API calls)
- Next to the search field, there are filter options:
  - **Date Range Filter:** A date picker that allows the user to filter research sessions by a start date and end date
  - **Score Range Filter:** A slider or dropdown that allows filtering by critic score range (e.g., "Show only 7+ scores")
  - **Sort By:** A dropdown to sort results by date (newest first / oldest first) or by score (highest first / lowest first)

**Research Session List:**
- Below the filters, the research sessions are displayed in a list or card grid format
- Each session card shows:
  - The research topic as the title
  - The date and time of the research
  - The overall critic score with a visual indicator
  - A 2-line preview snippet from the report
  - A "View Details" button that navigates to the Research Detail page
  - A "Delete" button (with a confirmation modal) that permanently removes the session from history
- The list supports pagination — showing 10-15 sessions per page with page navigation controls at the bottom
- If the user has no research history, the page shows an empty state with a message like "No research sessions yet. Start your first research from the Dashboard!" and a button linking to the dashboard

**Bulk Actions:**
- Each session card has a checkbox, and when one or more sessions are selected, a bulk action bar appears at the top with options to:
  - **Delete Selected:** Permanently removes all selected sessions (with confirmation)
  - **Export Selected:** Downloads all selected research reports as a combined PDF or ZIP file

---

### Page 9: Profile / Settings Page (Route: `/settings`)

**Purpose and Context:**
- This page allows authenticated users to view and modify their account information, manage their preferences, and control their account settings
- It is organized into logical sections or tabs for easy navigation

**Profile Information Section:**
- Displays the user's current profile information:
  - **Profile Picture / Avatar:** Shows the user's current avatar (uploaded image or auto-generated initials). There is a "Change Avatar" button that opens a file upload dialog allowing the user to upload a new profile picture — accepted formats are JPG, PNG, and GIF, with a maximum file size of 5MB
  - **Full Name:** Displayed as editable text with a "Save" button to update
  - **Email Address:** Displayed as read-only (since email is the login identifier) — if the user wants to change their email, there should be a separate "Change Email" workflow that involves verification
  - **Account Created Date:** Displayed as read-only showing when the user registered
- There is an "Update Profile" button that saves all changes to the profile information

**Password Management Section:**
- This section allows the user to change their password
- It contains three fields:
  - **Current Password:** Required to verify the user's identity before allowing a password change
  - **New Password:** With the same validation rules as registration (minimum 8 characters, uppercase, lowercase, number, special character)
  - **Confirm New Password:** Must match the new password
- There is a "Change Password" button that submits the new password after validating all fields
- After a successful password change, the user sees a success message and their existing sessions on other devices are optionally invalidated

**Notification Preferences Section:**
- Allows the user to control what notifications they receive:
  - **Email Notifications:** Toggle on/off for receiving email alerts when a research pipeline completes (useful if the user starts a research and navigates away)
  - **Research Completion Alerts:** Toggle on/off for in-app notifications when a pipeline finishes

**Account Management Section:**
- This section contains sensitive account actions:
  - **Export My Data:** A button that generates and downloads a JSON or CSV file containing all of the user's research data, profile information, and settings — this supports data portability
  - **Delete Account:** A prominently marked danger button that initiates the account deletion process — when clicked, a confirmation modal appears requiring the user to type "DELETE" to confirm, explaining that this action is permanent and will erase all their research data, profile information, and account credentials

**Connected Accounts Section (if OAuth is implemented):**
- Shows which social accounts (Google, GitHub) are linked to the user's ResearchAI account
- For each connected account, there is a "Disconnect" button
- For accounts not yet connected, there is a "Connect" button that initiates the OAuth linking flow

---

### Page 10: About Page (Route: `/about`)

**Purpose and Context:**
- This page provides detailed information about the ResearchAI platform, the technology behind it, and the team or individual who built it

**Platform Description:**
- A detailed explanation of what ResearchAI is, why it was built, and the problem it solves
- This should cover the multi-agent architecture concept and explain how four specialized AI agents collaborate to produce research that would take a human hours to complete manually

**Technology Stack:**
- A section describing the technologies powering the platform:
  - **Frontend:** React-based single-page application
  - **AI/ML:** LangChain framework orchestrating multiple AI agents
  - **Language Model:** Groq's Qwen3-32B model for high-quality text generation
  - **Search:** Tavily API for real-time web search
  - **Web Scraping:** BeautifulSoup for intelligent content extraction
- Each technology is briefly explained in terms of why it was chosen and what role it plays

**Open Source:**
- A section mentioning that the project is open source (linked to the GitHub repository at https://github.com/vinay-kumar-3574/ResearchAI)
- A brief explanation of how others can contribute, report issues, or fork the project

---

### Page 11: 404 Not Found Page (Route: any unmatched route)

**Purpose and Context:**
- This page is displayed whenever a user navigates to a URL that does not match any defined route in the application

**Content:**
- A clear "404" indicator and a message like "Page Not Found"
- A brief friendly message explaining that the page they're looking for doesn't exist or may have been moved
- A "Go to Dashboard" button for authenticated users or a "Go to Home" button for unauthenticated users
- A search field or list of helpful links to guide the user to where they might have intended to go

---

## Navigation & Page Connections

**Global Navigation Bar (for authenticated users):**
- Present on all authenticated pages (Dashboard, History, Settings, Research Detail, About)
- Contains: ResearchAI Logo (→ Dashboard), Dashboard link (→ `/dashboard`), History link (→ `/history`), User avatar dropdown (→ Settings, Logout)
- The currently active page is visually highlighted in the navigation

**Landing Page Navigation:**
- Logo → Refreshes landing page
- "Start Researching" CTA → `/signup` (if not logged in) or `/dashboard` (if logged in)
- "Log In" header link → `/login`
- "Sign Up" header link → `/signup`

**Authentication Flow Connections:**
- `/signup` → successful registration → `/login` (or directly to `/dashboard`)
- `/login` → successful login → `/dashboard`
- `/login` → "Forgot Password?" → `/forgot-password`
- `/forgot-password` → email sent → user clicks link → `/reset-password/:token`
- `/reset-password/:token` → successful reset → `/login`
- `/signup` ↔ `/login` — bidirectional links ("Already have an account?" / "Don't have an account?")

**Dashboard Flow Connections:**
- `/dashboard` → "Start Research" → pipeline runs → results appear on same page → "View Full Report/Critique" → `/research/:id`
- `/dashboard` → "View Details" on recent research card → `/research/:id`
- `/dashboard` → "View All History" → `/history`
- `/dashboard` → User dropdown → "Settings" → `/settings`
- `/dashboard` → User dropdown → "Logout" → clears session → `/login`

**Research History Connections:**
- `/history` → "View Details" on any session → `/research/:id`
- `/history` → "Back to Dashboard" → `/dashboard`

**Research Detail Connections:**
- `/research/:id` → "Back to Dashboard" → `/dashboard`
- `/research/:id` → source URLs in search results → external links (open in new tab)
- `/research/:id` → "Download as PDF" → triggers file download
- `/research/:id` → "Delete" → confirmation modal → deletes session → redirects to `/history`

**Settings Connections:**
- `/settings` → "Delete Account" → confirmation → deletes account → redirects to `/` (landing page)
- `/settings` → any navigation link → respective page

---

## Authentication & Route Protection

**Protected Routes:**
- The following routes require authentication: `/dashboard`, `/research/:id`, `/history`, `/settings`
- If an unauthenticated user attempts to access any protected route, they are automatically redirected to `/login` with a query parameter preserving their intended destination (e.g., `/login?redirect=/dashboard`)
- After successful login, the user is redirected to their originally intended destination rather than always going to the dashboard

**Public Routes:**
- The following routes are accessible without authentication: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password/:token`, `/about`
- If an authenticated user visits `/login` or `/signup`, they are automatically redirected to `/dashboard`

**Session Management:**
- Authentication tokens are stored securely and checked on every route transition
- If a token expires while the user is actively using the application, a session expiration modal appears informing the user that their session has expired and providing a "Log In Again" button
- The application maintains a global authentication state (via React Context or a state management library) that is accessible from any component

---

## Responsive Behavior

- The entire application must be fully responsive, working seamlessly across desktop (1200px+), tablet (768px–1199px), and mobile (below 768px) screen sizes
- On mobile devices:
  - The navigation bar collapses into a hamburger menu
  - The pipeline stages in the dashboard stack vertically instead of displaying horizontally
  - Research session cards in the history page switch from a grid layout to a single-column list
  - All forms (login, signup, settings) take full width with appropriately sized touch targets
  - The tabbed content on the Research Detail page uses swipeable tabs or a dropdown tab selector
- All interactive elements (buttons, links, inputs) must have appropriately sized touch targets (minimum 44x44px) for mobile usability

---

## Error & Loading States

**Loading States:**
- Every page that fetches data from an API should show a skeleton loading state while data is being retrieved — this means showing placeholder shapes that match the layout of the actual content, giving the user a preview of where content will appear
- The research pipeline stages should show animated spinners or progress indicators during execution
- All buttons that trigger API calls should show a loading spinner and become disabled during the request to prevent duplicate submissions

**Error States:**
- If an API call fails, the affected section should display a clear error message with a "Retry" button
- Network errors should show a global notification banner at the top of the page: "Unable to connect. Please check your internet connection."
- If the research pipeline fails at any stage, that stage should show a red error indicator with the specific error message, while previous successful stages retain their results

**Empty States:**
- When the user has no research history, the History page shows a friendly illustration and message encouraging them to start their first research
- When the dashboard has no recent research sessions, it shows a prompt guiding the user to the research input field
