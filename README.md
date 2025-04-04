# SALHJS - Simple AWS Lambda Handler (with Middleware)

[![npm version](https://badge.fury.io/js/salhjs.svg)](https://badge.fury.io/js/salhjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SALHJS** (Simple AWS Lambda Handler JS) is a lightweight and customizable function handler for AWS Lambda in JavaScript, inspired by common middleware patterns (like Express).

It helps you structure your Lambda function logic into a series of independent, testable steps (middleware functions) that process a shared data object. This promotes cleaner, more maintainable, and reusable code.

**Key Features:**

*   **Middleware Pattern:** Chain functions together, passing data sequentially.
*   **Centralized Data:** A common data object is passed through all functions.
*   **Consistent Error Handling:** Handles errors thrown or passed via `next(err)` gracefully.
*   **Standard Response Format:** Returns API Gateway Proxy compatible responses (`statusCode`, `body`).
*   **Lightweight & Simple:** Minimal overhead, easy to understand and integrate.

## Why Use This?

Instead of writing monolithic Lambda functions, SALHJS encourages breaking down logic into smaller, focused middleware functions. This makes your code:

*   **Easier to Test:** Test each middleware function in isolation.
*   **More Reusable:** Reuse common logic (like authentication, validation) across different Lambda functions.
*   **Better Organized:** Improves readability and maintainability.

## Install

```bash
npm install salhjs
# or
yarn add salhjs
```

## Usage

```javascript
const Handler = require('salhjs');

// --- Middleware Functions ---
// Each function receives a 'data' object and a 'next' callback.
// Modify the 'data' object as needed.
// Call 'next()' to proceed to the next function.
// Call 'next(err)' to stop execution and trigger the error handler.

// Example: Parse the request body
function parseBody(data, next) {
  console.log('Parsing body...');
  try {
    // The initial 'data' object contains 'event' and 'context'
    if (data.event.body) {
      data.payload = JSON.parse(data.event.body);
    } else {
      data.payload = {};
    }
    // Proceed to the next function
    return next(null, data); // Pass modified data along
  } catch (error) {
    // Trigger error handling
    console.error('Failed to parse body:', error);
    // You can customize the error object
    error.status = 400; // Bad Request
    error.message = 'Invalid JSON body';
    return next(error);
  }
}

// Example: Add some data
function addData(data, next) {
  console.log('Adding data...');
  // Access data added by previous functions (e.g., data.payload)
  data.message = 'Hello from SALHJS!';
  data.timestamp = new Date().toISOString();
  return next(null, data);
}

// Example: Simulate an async operation (e.g., database call)
async function simulateAsync(data, next) {
  console.log('Simulating async operation...');
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
  data.asyncResult = 'Data fetched!';
  return next(null, data);
}

// --- AWS Lambda Handler ---
module.exports.myApiHandler = async (event, context) => {
  const handler = new Handler(event, context);

  try {
    // Pass middleware functions to handleRequest
    const result = await handler.handleRequest(
      parseBody,
      addData,
      simulateAsync
      // Add more functions as needed
    );

    // The final data object (excluding event/context) is in result.data
    console.log('Request successful:', result);

    return {
      statusCode: result.status, // Typically 200 on success
      body: JSON.stringify(result.data),
      headers: {
        'Content-Type': 'application/json',
      },
    };

  } catch (error) { // Catch errors from handleRequest (already formatted)
    console.error('Request failed:', error);

    return {
      statusCode: error.status, // e.g., 400, 500
      body: JSON.stringify(error.data), // Contains { message, func }
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
```

## API

### `new Handler(event, context)`

Creates a new handler instance.

*   `event`: (Object) The AWS Lambda event object.
*   `context`: (Object) The AWS Lambda context object.

### `async handler.handleRequest(...functions)`

Executes the provided middleware functions sequentially.

*   `...functions`: (Function) A sequence of middleware functions.
    *   **Middleware Function Signature:** `function (data, next)` or `async function (data, next)`
        *   `data`: (Object) An object containing `event`, `context`, and any data added by previous middleware.
        *   `next`: (Function) A callback function `(err, updatedData) => void`.
            *   Call `next()` or `next(null, data)` to proceed to the next middleware. You can optionally pass the modified `data` object as the second argument. If omitted, the existing `data` object is used.
            *   Call `next(err)` to stop the execution chain and trigger the error handler. The `err` object (preferably an `Error` instance) can optionally have `status` (number) and `message` (string) properties to customize the final response.
*   **Returns:** `Promise<Object>` - A promise that resolves with a success object `{ status: number, data: Object }`.
*   **Rejects:** `Promise<Object>` - A promise that rejects with an error object `{ status: number, data: { message: string, func: string } }`. *Note: It's recommended to use a `try...catch` around `handleRequest` as shown in the usage example to handle the rejection gracefully.*

### Data Object (`data`)

The `data` object passed to each middleware function initially contains:

*   `event`: The original AWS Lambda event.
*   `context`: The original AWS Lambda context.

Middleware functions can add, modify, or delete properties on this object. The final `data` object returned in the success response (or available in the error handler) contains all accumulated modifications, *excluding* the initial `event` and `context` properties for a cleaner response payload.

### Error Handling

*   If a middleware function calls `next(err)`, execution stops.
*   If a middleware function throws an synchronous error, execution stops.
*   The `handleRequest` method catches these errors and formats them into the standard error response `{ status, data: { message, func } }`.
*   The `status` defaults to `500` but can be overridden by setting `error.status`.
*   The `message` defaults to `'Something went wrong'` or `error.message` if available.
*   The `func` property indicates the name of the function where the error occurred.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the terms of the MIT license. See the [LICENSE](LICENSE) file for details.