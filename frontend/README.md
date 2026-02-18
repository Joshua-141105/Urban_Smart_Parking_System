# EDITH Smart Parking System - Frontend

This is the React frontend for the Urban Smart Parking System.

## Project Setup

1.  Make sure you are in the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

## Features Implemented

-   **Authentication**: Login & Register with Role-based access (Driver, Admin, Manager).
-   **Dashboard**: Role-specific dashboards.
-   **Map Integration**: Interactive Leaflet map to find parking.
-   **Booking System**: Book parking spots with mock payment.
-   **Real-time Updates**: WebSocket integration for live occupancy.
-   **Premium UI**: Glassmorphism design with dark theme.

## Architecture

-   `src/api`: Axios configuration for backend communication.
-   `src/context`: Auth and WebSocket contexts.
-   `src/pages`: Feature pages (Driver, Admin, Auth).
-   `src/components`: Reusable UI components.

## Tech Stack

-   React + Vite
-   Leaflet (Maps)
-   Vanilla CSS (Variables + Flex/Grid)
-   Axios + STOMP (API + Real-time)
