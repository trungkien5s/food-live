# Food Live – Full-stack Food Delivery System (Monorepo)

A full-stack food delivery application built as a monorepo:
- **Frontend**: `deliveryfood-fe/`
- **Backend**: `deliveryfood/`

## Features

### Frontend
- Responsive UI for browsing products, cart, checkout, and order tracking
- UI built with **TailwindCSS** + **Ant Design**
- Authentication-ready screens and reusable components

### Backend
- Modular REST API architecture (users, categories, orders, chat, etc.)
- JWT Authentication (access token) + Refresh token flow
- Email-based account flows (register / verify / activate)
- Real-time chat via WebSocket gateway
- API documentation (Swagger if enabled)

## Tech Stack

**Frontend**
- React
- TailwindCSS, Ant Design

**Backend**
- Node.js (NestJS/Express-based, depending on implementation)
- Database: MongoDB (Mongoose) or equivalent
- WebSocket for real-time features

## Project Structure

```bash
food-live/
  deliveryfood-fe/     # Frontend
  deliveryfood/        # Backend
