// src/docs/swagger.js
// OpenAPI 3 spec for the Auth System API. The /api-docs page is built from it.
 
const errorResponse = (description) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});
 
const tokenParam = (description) => ({
  name: "token",
  in: "path",
  required: true,
  description,
  schema: { type: "string", example: "3f9a1c0b7d..." },
});
 
const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Auth System API",
    version: "1.0.0",
    description:
      "Authentication API: sign up with email verification, login, logout, " +
      "forgot / reset password. Built with Node.js, Express, MongoDB, Redis and JWT.\n\n" +
      "**How to try the protected endpoints:** log in, copy the `token` from the response, " +
      "click **Authorize** and paste it.",
  },
  servers: [
    { url: "https://authsystem-production-7586.up.railway.app", description: "Production (Railway)" },
    { url: "http://localhost:5000", description: "Local" },
  ],
  tags: [{ name: "Auth", description: "Registration, login and password recovery" }],
 
  paths: {
    "/api/v1/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        description:
          "Creates the account and sends a confirmation link to the email. " +
          "The account cannot log in until the email is confirmed. " +
          "Unconfirmed accounts are deleted automatically after 24 hours.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Signup" } },
          },
        },
        responses: {
          201: {
            description: "Account created, confirmation email sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: { type: "string", example: "Check your email to confirm your account" },
                  },
                },
              },
            },
          },
          400: errorResponse("Validation error (bad email, weak password, missing field)"),
          409: errorResponse("Email already registered"),
          429: errorResponse("Too many signup attempts"),
        },
      },
    },
 
    "/api/v1/auth/verify-email/{token}": {
      get: {
        tags: ["Auth"],
        summary: "Confirm the email address",
        description:
          "This is the link sent by email. Opening it marks the account as verified. " +
          "The token is single-use and expires after 24 hours.",
        parameters: [tokenParam("Token from the confirmation email (64 hex characters)")],
        responses: {
          200: {
            description: "Email confirmed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: { type: "string", example: "confirmed" },
                  },
                },
              },
            },
          },
          400: errorResponse("Link is invalid, expired or already used"),
        },
      },
    },
 
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        description:
          "Returns a JWT. The email must be confirmed first. " +
          "Failed attempts are rate limited (5 per 15 minutes per IP).",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Login" } },
          },
        },
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          400: errorResponse("Email or password is incorrect"),
          403: errorResponse("Email is not confirmed yet"),
          429: errorResponse("Too many failed attempts, try again later"),
        },
      },
    },
 
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description:
          "Revokes the current token on the server (stored in Redis until it would have expired). " +
          "Using the same token afterwards returns 401.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: { type: "string", example: "Logged out" },
                  },
                },
              },
            },
          },
          401: errorResponse("Missing, invalid, expired or already revoked token"),
        },
      },
    },
 
    "/api/v1/auth/forgotpassword": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset email",
        description:
          "Sends a reset link valid for 15 minutes. The response is the same whether or not " +
          "the email exists, so accounts cannot be discovered. Limited to 5 requests per hour.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ForgotPassword" } },
          },
        },
        responses: {
          200: {
            description: "If the email exists, a reset link was sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: { type: "string", example: "If the email exists, a reset link has been sent" },
                  },
                },
              },
            },
          },
          400: errorResponse("Invalid email format"),
          429: errorResponse("Too many requests"),
          500: errorResponse("Email could not be sent"),
        },
      },
    },
 
    "/api/v1/auth/reset-password/{token}": {
      patch: {
        tags: ["Auth"],
        summary: "Set a new password",
        description: "Uses the token from the reset email. The token is single-use and expires after 15 minutes.",
        parameters: [tokenParam("Token from the reset email")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResetPassword" } },
          },
        },
        responses: {
          200: { description: "Password updated, you can log in with the new password" },
          400: errorResponse("Token invalid or expired, or weak password"),
        },
      },
    },
  },
 
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          status: { type: "string", example: "fail" },
          message: { type: "string", example: "email or password is incorrect!" },
        },
      },
      Signup: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50, example: "Ashraf" },
          email: { type: "string", format: "email", example: "ashraf@example.com" },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            description: "At least 8 characters, with a letter and a number",
            example: "test1234",
          },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ashraf@example.com" },
          password: { type: "string", example: "test1234" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1c2a9e4b0a1d2c3e4f567" },
          name: { type: "string", example: "Ashraf" },
          email: { type: "string", example: "ashraf@example.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          emailVerified: { type: "boolean", example: true },
        },
      },
      ForgotPassword: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "ashraf@example.com" },
        },
      },
      ResetPassword: {
        type: "object",
        required: ["password"],
        properties: {
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            example: "newpass1234",
          },
        },
      },
    },
  },
};
 
module.exports = swaggerSpec;
 