## 2025-05-22 - Missing Backend JWT Verification
**Vulnerability:** The backend endpoints for `showgrid-be` were completely unprotected, allowing anyone to perform actions like liking, rating, or deleting submissions by sending direct requests to the API.
**Learning:** Even when the frontend uses a robust authentication provider like Clerk, the backend must independently verify the JWTs provided in the `Authorization` header to enforce security.
**Prevention:** Always implement a middleware to verify authentication tokens on all non-public API endpoints. Use `@clerk/clerk-sdk-node` for seamless integration with Clerk.
