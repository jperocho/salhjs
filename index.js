/**
 * SALHJS - Simple AWS Lambda Handler (with Middleware)
 *
 * @description
 * A lightweight function handler for AWS Lambda using a middleware pattern.
 * It executes a series of functions, passing a shared data object,
 * and provides consistent error handling and response formatting.
 *
 * @license MIT
 * @author John Mark Perocho
 * @email per.eight@gmail.com
 */
class SimpleHandler {
	/**
   * Creates an instance of SimpleHandler.
   * @param {Object} event - The event object passed to the Lambda function.
   * @param {Object} context - The context object passed to the Lambda function.
   */
	constructor (event, context) {
		this.event = event;
		this.context = context;
		// Initial data passed to the first function
		this.initialData = { event, context };
	}

	/**
   * Executes a sequence of middleware functions.
   * @param {...Function} funcs - The middleware functions to execute in order.
   * Each function should have the signature: (data, next) => void
   *   - data: Object containing event, context, and accumulated data.
   *   - next: Function callback (err, updatedData) => void. Call next() or next(null, data) to continue, next(err) to stop with error.
   * @returns {Promise<Object>} Resolves with { status, data } on success.
   * @rejects {Promise<Object>} Rejects with { status, data: { message, func } } on error.
   */
	async handleRequest (...funcs) {
		let currentData = { ...this.initialData }; // Start with initial event/context

		for (const func of funcs) {
			const funcName = func.name || 'anonymous function';
			console.log(`Calling function: ${funcName}`);
			currentData.currentFunc = funcName; // Track current function for error reporting

			try {
				// Wrap the function call in a promise to handle both sync/async and callback patterns
				currentData = await new Promise((resolve, reject) => {
					// Execute the middleware function
					const maybePromise = func(currentData, (error, nextData) => {
						if (error) {
							// Attach function name to the error if not already present
							if (!error.func) {
								error.func = funcName;
							}
							return reject(error); // Error passed to next()
						}
						// Resolve with updated data if provided, otherwise use existing data
						resolve(nextData || currentData);
					});

					// Handle cases where the function itself returns a promise (less common with 'next' pattern)
					// This primarily catches synchronous throws or unhandled promise rejections within 'func'
					if (maybePromise instanceof Promise) {
						maybePromise.catch(err => {
							if (!err.func) {
								err.func = funcName;
							}
							reject(err);
						});
					}

				});
			} catch (error) {
				// Catch errors from next(err) or synchronous throws
				console.error(`Error caught in function "${error.func || funcName}":`, error.message || error);
				return this.handleError(error, currentData, funcName); // Format and return error immediately
			}
		}

		// If all functions executed successfully
		return this.handleSuccess(currentData);
	}

	/**
   * Formats a success response.
   * Removes internal properties like 'event', 'context', 'currentFunc' from the final data payload.
   * @param {Object} data - The final accumulated data object.
   * @returns {Object} Formatted success response { status: 200, data: Object }.
   */
	handleSuccess (data) {
		// Clone data and remove handler-specific properties for the final response body
		const responseData = { ...data };
		delete responseData.event;
		delete responseData.context;
		delete responseData.currentFunc; // Remove internal tracking property
		return responseData;
	}

	/**
   * Formats an error response.
   * Rejects the promise chain with a standardized error object.
   * @param {Error | Object} error - The error object caught. Can have `status` and `message`.
   * @param {Object} data - The data object at the time of the error.
   * @param {string} funcName - The name of the function that caused the error.
   * @returns {Promise<Object>} A rejected promise with { status, data: { message, func } }.
   */
	handleError (error, data, funcName) {
		// Determine status code: use error.status, or default to 500
		const status = typeof error.status === 'number' ? error.status : 500;

		// Determine error message
		const message = error.message || 'An unexpected error occurred.';

		// Identify the function where the error originated
		const errorFunc = error.func || funcName || data?.currentFunc || 'unknown function';

		console.error(`Error in function "${errorFunc}" (Status: ${status}): ${message}`);

		const errorResponse = {
			status,
			data: {
				message: message,
				func: errorFunc, // Function where error was detected/thrown
			},
		};
		// Instead of returning, we reject the promise chain as indicated in handleRequest JSDoc
		// This allows catching it outside handler.handleRequest
		// Note: The try/catch in handleRequest already catches this and returns it.
		// For clarity and adherence to typical Promise rejection patterns, we throw.
		// The caller should use try/catch around handler.handleRequest.
		throw errorResponse;
	}
}

module.exports = SimpleHandler;