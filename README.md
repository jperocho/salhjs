# Simple AWS Lambda Handler JS

Simple AWS Lambda Handler JS is a lightweight and customizable function handler designed for use with AWS Lambda in JavaScript. It provides a convenient way to execute a series of functions with a common data object and handle errors and responses in a consistent way. The SimpleHandler class is designed to be easy to use and flexible, making it a great choice for developers who need a reliable function handler for their AWS Lambda functions. It follows the common pattern middleware for easier and testable code, and can be extended to meet the specific needs of your project.

## Install

```bash
$ npm i salhjs
```

## Examples

Here are some examples of how to use the Handler class in your AWS Lambda functions:

```javascript
const Handler = require('salhjs');

module.exports.awsHandlerName = async (event) => {
  const handler = new Handler(event, context);
  const { status, data } = await handler.handleRequest(func1, func2, func3);

  return {
    statusCode: status,
    body: JSON.stringify(data),
  };
}

function func1 (data, next) {
  console.log('function 1');
  data.func1 = 'From func1';
  return next(null, data);
};

function func2 (data, next) {
  console.log('function 2');
  data.func2 = 'From func2';
  return next(null, data);
};

function func3 (data, next) {
  console.log('function 3');
  data.func3 = 'From func3';
  return next(null, data);
};
```

## License

This project is licensed under the terms of the MIT license. See the LICENSE file for details.