# Local Fix

## About The Project

Local Fix is an AI-powered civic engagement platform designed to empower residents to report, track, and collaborate on local issues in their neighborhoods. The application serves as a digital bridge between the community and local authorities, transforming how neighborhoods handle infrastructure repairs, community safety, and local initiatives.

## Key Features

*   **AI Civic Assistant:** An intelligent chatbot powered by the Google Gemini API that helps users report issues conversationally. It automatically extracts details, categorizes the problem, and assesses its severity.
*   **Real-time Map View:** A geo-spatial dashboard displaying all active and resolved issues across the neighborhood.
*   **Community Hub:** Dedicated spaces for local groups to organize, discuss, and crowdsource solutions collaboratively.
*   **Admin & Analytics Dashboard:** Detailed insights, heatmaps, and resolution tracking tailored for city administrators and community leaders.
*   **Gamification:** A system that recognizes and rewards active citizens to encourage continuous civic engagement.

## Built With

*   React.js (Vite)
*   Firebase (Firestore, Authentication, Hosting)
*   Google Gemini API (via Google AI Studio)
*   Framer Motion
*   HTML5 Canvas (High-performance rendering)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

*   npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  Clone the repository
    ```sh
    git clone https://github.com/M0izz/Community-Helper.git
    ```
2.  Navigate to the project directory
    ```sh
    cd Community-Helper
    ```
3.  Install NPM packages
    ```sh
    npm install
    ```
4.  Create a `.env` file in the root directory and add your Firebase and Gemini API keys:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
5.  Start the development server
    ```sh
    npm run dev
    ```

## Usage

After starting the development server, navigate to the provided localhost URL in your browser. Users can explore the landing page, log into the platform, report issues using the AI Civic Assistant, view community statistics on the Map View, and engage with neighborhood organizations in the Communities tab.
