/**
 * Simple Handler - A Simple Function Handler for AWS Lambda in JavaScript
 *
 * @description
 * This is a simple function handler designed for use with AWS Lambda in JavaScript. It provides a convenient way to execute
 * a series of functions with a common data object and handle errors and responses in a consistent way. The Handler class is
 * designed to be easy to use and customizable, making it a great choice for developers who need a flexible and reliable function
 * handler for their AWS Lambda functions.
 *
 * @license MIT
 * @author John Mark Perocho
 * @email per.eight@gmail.com
 * 
 * @param {Object} event - The event object passed to the Lambda function.
 * @param {Object} context - The context object passed to the Lambda function.
 */
function SimpleHandler(event, context) {
  // Set the event and context properties of the SimpleHandler instance.
  this.event = event;
  this.context = context;
}

/**
 * handleRequest - Handles a series of functions and returns the response data.
 *
 * @param {...Function} funcs - The functions to be executed in order.
 * @returns {Promise} A Promise that resolves with the response data or rejects with an error.
 */
SimpleHandler.prototype.handleRequest = function (...funcs) {
  // Call the first function in the series with the event, context, and function name data.
  return this.callFunction(funcs[0], { event: this.event, context: this.context, currentFunc: funcs[0].name })
    // Call the remaining functions in the series with the data from the previous function.
    .then(data => this.nextFunction(funcs.slice(1), data))
    // Handle the successful response by returning an object with a status code and the response data.
    .then(this.handleSuccess)
    // Handle errors by returning an object with a status code and the error data.
    .catch(this.handleError);
};

/**
 * callFunction - Calls a function with the specified data and returns a Promise that resolves with the updated data.
 *
 * @param {Function} func - The function to be called.
 * @param {Object} data - The data to be passed to the function.
 * @returns {Promise} A Promise that resolves with the updated data or rejects with an error.
 */
SimpleHandler.prototype.callFunction = function (func, data) {
  // Get the function name or set it to "anonymous function".
  const { name: funcName = 'anonymous function' } = func;
  // Log a message indicating that the function is being called.
  console.log(`Calling function ${funcName}`);
  // Call the function with the data and return a Promise that resolves with the updated data or rejects with an error.
  return new Promise((resolve, reject) => {
    func(data, (error, newData) => {
      if (error) {
        // If the function call resulted in an error, reject the Promise with an error object that includes the error and the current function name.
        return reject({ ...error, data: { ...data, currentFunc: funcName } });
      }

      // If the function call was successful, resolve the Promise with the updated data or the original data if no new data was returned.
      return resolve(newData || data);
    });
  });
};

/**
 * nextFunction - Calls the next function in the chain of functions and passes the updated data to it.
 *
 * @param {Array<Function>} funcs - The remaining functions to be called.
 * @param {Object} data - The current data object.
 * @returns {Promise} A Promise that resolves with the updated data when all functions have been called.
 */
SimpleHandler.prototype.nextFunction = function (funcs, data) {
  // If there are no more functions in the chain, return a Promise that resolves with the data.
  if (funcs.length === 0) {
    return Promise.resolve(data);
  }

  // Call the next function in the chain with the updated data and move on to the next function.
  const [nextFunc, ...remainingFuncs] = funcs;

   // Get the next function name or set it to "anonymous function".
  const { name: nextFuncName = 'anonymous function' } = nextFunc;

  // If a function name is provided, use it as the name of the current function; otherwise, default to 'anonymous function'.
  return this.callFunction(nextFunc, { ...data, currentFunc: nextFuncName })
    // Recursively call this function with the remaining functions in the chain and the updated data from the current function.
    .then(nextData => this.nextFunction(remainingFuncs, nextData));
};

/**
 * Formats a success response with a status code and the provided data.
 * @param {Object} data - The response data.
 * @returns {Object} An object with a status code and the response data.
 */
SimpleHandler.prototype.handleSuccess = function (data) {
  return { status: 200, data };
};

/**
 * Formats an error response with a status code and a message indicating which function caused the error.
 * @param {Object} error - The error object, which includes a message, status code, and current function name.
 * @returns {Object} An object with a status code and the error data.
 */
SimpleHandler.prototype.handleError = function (error) {
  const { data: { currentFunc, message = 'Something went wrong' }, status = 500 } = error;
  console.error(`Error in function ${currentFunc}: ${message}`);
  const response = { message, func: currentFunc };
  return { status, data: response };
};

/**
 * Sets the response data and returns an object with a status code and the provided data.
 * @param {number} status - The HTTP status code for the response.
 * @param {Object} data - The response data.
 * @returns {Object} An object with a status code and the response data.
 */
SimpleHandler.prototype.response = function (status, data) {
  this.responseData = { ...data };
  return { status, data };
};

module.exports = SimpleHandler;