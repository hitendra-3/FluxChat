# FluxChat – Real-Time Message Flow

**FluxChat** is a high-performance, real-time web application designed for seamless, fluid communication. The name **FluxChat** reflects the "flow" and transience of real-time messaging—where conversations move quickly and naturally.

Built for privacy and speed, FluxChat operates without a persistent database. This means your private rooms and messages live only as long as you need them, offering a truly transient and secure chatting experience.

## Features

- **Real-Time Messaging**: Powered by Socket.IO for instantaneous, bi-directional "flux."
- **Persistent Session Avatars**: Choose from 4 unique avatars (2 men, 2 women) that follow you globally across the sidebar, member lists, and chat bubbles.
- **Dynamic Public & Private Rooms**: 
  - **Public Lounge**: Join 6 permanent tech-focused rooms (`#cse`, `#tech`, `#coding`, `#ai`, `#webdev`, `#placements`) globally available to everyone.
  - **Private Channels**: Create custom rooms with 4-digit codes to chat privately with friends.
- **Auto-Evaporate Security**: Since FluxChat is database-free, all custom room data and messages are automatically cleared when the last user goes offline, ensuring no logs are left behind.
- **Premium UI/UX**: A polished, iOS-inspired interface with responsive message bubbles, typing indicators, and mobile-first entry fields.

## Tech Stack

- **Frontend**: Next.js 16 (React) + Tailwind CSS.
- **Backend**: Node.js + Express with Socket.IO.
- **Avatars**: [DiceBear Avataaars](https://api.dicebear.com/7.x/avataaars/svg).
- **Icons**: Lucide React.
  
## Getting Started (Local Development)

### Prerequisites

Ensure you have **Node.js** and **npm** installed.

### Installation

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

You need two terminals running simultaneously:

1. **Terminal 1 (Socket Server)**:
   ```bash
   node server.js
   ```

2. **Terminal 2 (Frontend)**:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to start chatting!

## Deployment Guide

FluxChat requires a hosting provider that supports long-lived WebSockets. 

### Recommended Platforms
- **Railway.app / Render.com**: Highly recommended. These platforms can host both the Next.js frontend and the Node.js socket server in a single "Web Service" or as two linked services.
- **DigitalOcean / AWS / Google Cloud (VPS)**: Ideal for full control. You can run both processes using a process manager like `pm2`.

### Essential Deployment Steps
1. **Environment Variables**: Ensure you set `NODE_ENV=production`.
2. **Ports**: The socket server defaults to port `4000`. Ensure your firewall allows traffic on this port, or update `server.js` to use the environment's `PORT`.
3. **Frontend Connection**: Update the socket connection URL in your frontend hooks (`useChat`) to point to your live server URL instead of `localhost`.

---

## Latest Improvements
- **Mobile Input Optimization**: Redesigned the message input area into a unified pill container for better mobile usability.
- **Member Awareness**: Users in the member list now show exactly which room they are in (e.g., *Active now (#cse)*).
- **Branding**: Fully migrated to the **FluxChat** identity with updated metadata and visual styling.
