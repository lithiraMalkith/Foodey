# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Enhanced delivery system with improved restaurant information handling
- Unique index on orderId in delivery model to prevent duplicate deliveries
- Robust error handling for delivery assignments with proper fallbacks
- Support for passing restaurant information from frontend to delivery service
- Enhanced order service API to always include restaurant information
- Email notification system using Nodemailer for order confirmations and delivery notifications
- Service-to-service authentication using JWT
- Admin dashboard for order management
- Structured address handling for improved delivery assignment
- New API endpoints:
  - GET /api/users/:userId/address in user service to fetch a user's default address
  - GET /api/orders/:id in order service to fetch a specific order by ID
- Delivery address display in order details
- Item details display in delivery assignments
- Completely redesigned Home page with full-screen hero image and modern UI
- New futuristic Login and Register pages with glass-like interface
- Modern Navbar with transparent background and improved navigation
- Extended user access permissions to allow delivery personnel to view user information

### Changed
- Improved delivery assignment process to handle restaurant information more efficiently
- Enhanced auto-assign endpoint to better handle already assigned deliveries
- Updated service-to-service communication to use JWT_SECRET directly for reliability
- Completely redesigned Order Management UI with modern card-based layout
- Redesigned Delivery Assignment UI with improved visual hierarchy
- Updated docker-compose.yml with service configurations including email credentials
- Modified notification middleware for inter-service communication
- Renamed "Confirm Without Address" button to "Use Order Address" in the admin dashboard
- Improved auto-assignment logic to utilize structured address data
- Enhanced error and success message styling with icons and better visual feedback
- Updated application branding from "Food Delivery" to "Foodey" with gradient text
- Improved mobile responsiveness across all pages
- Enhanced visual hierarchy with better typography and spacing

### Fixed
- Fixed issue with missing restaurant names in delivery assignments
- Resolved duplicate delivery creation problem with database-level constraints
- Improved error handling in delivery service to prevent failures during assignment
- Enhanced token handling to fix authentication issues in service-to-service communication
- Added proper fallback values for restaurant names when not available
- Resolved 403 Forbidden error in order placement
- Fixed 401 Unauthorized error in service communication
- Fixed syntax errors in OrderManagement.js
- Corrected address handling in delivery assignment process
- Fixed route ordering in Express to ensure specific routes come before parameter routes

## [1.0.0] - 2025-04-27
### Initial Release
- Basic order management system
- User authentication and authorization
- Restaurant management features
