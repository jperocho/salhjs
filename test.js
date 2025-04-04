/* eslint-disable no-undef */
const assert = require('assert');
const SimpleHandler = require('.'); // Assuming index.js is in the same directory

describe('SimpleHandler', () => {
	const mockEvent = { body: '{"key":"value"}', requestContext: { requestId: 'test-id' } };
	const mockContext = { functionName: 'test-lambda', awsRequestId: 'aws-test-id' };

	// --- Test Middleware ---
	const func1 = (data, next) => {
		data.func1 = 'Data from func1';
		return next(null, data);
	};

	const func2 = async (data, next) => {
		await new Promise(res => setTimeout(res, 10)); // Simulate async
		data.func2 = 'Data from func2';
		return next(null, data);
	};

	const func3 = (data, next) => {
		// Access event/context
		assert.ok(data.event.requestContext.requestId);
		assert.ok(data.context.functionName);
		data.func3 = 'Data from func3';
		return next(); // Test next() without data arg
	};

	const errorFuncSync = () => {
		throw new Error('Sync error!');
	};

	const errorFuncNext = (data, next) => {
		const err = new Error('Error via next!');
		err.status = 400; // Custom status
		return next(err);
	};

	const errorFuncAsync = async (data, next) => {
		await new Promise(res => setTimeout(res, 5));
		const err = new Error('Async error via next!');
		err.status = 422; // Custom status
		return next(err);
	};

	const anonymousFunc = (data, next) => {
		data.anon = true;
		next(null, data);
	};


	it('should execute functions sequentially and return success', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		let result;
		try {
			result = await handler.handleRequest(func1, func2, func3);
		} catch(e) {
			assert.fail(`Should not have thrown error: ${e.message}`);
		}


		assert.strictEqual(result.status, 200);
		assert.deepStrictEqual(result.data, {
			func1: 'Data from func1',
			func2: 'Data from func2',
			func3: 'Data from func3',
		});
		// Ensure original event/context are NOT in the final data
		assert.strictEqual(result.data.event, undefined);
		assert.strictEqual(result.data.context, undefined);
	});

	it('should handle anonymous functions', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		let result;
		try {
			result = await handler.handleRequest(func1, anonymousFunc);
		} catch(e) {
			assert.fail(`Should not have thrown error: ${e.message}`);
		}

		assert.strictEqual(result.status, 200);
		assert.deepStrictEqual(result.data, {
			func1: 'Data from func1',
			anon: true,
		});
	});


	it('should handle errors passed via next() with custom status', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		try {
			await handler.handleRequest(func1, errorFuncNext, func3);
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.strictEqual(error.status, 400);
			assert.deepStrictEqual(error.data, {
				message: 'Error via next!',
				func: 'errorFuncNext',
			});
		}
	});

	it('should handle async errors passed via next() with custom status', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		try {
			await handler.handleRequest(func1, func2, errorFuncAsync, func3);
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.strictEqual(error.status, 422);
			assert.deepStrictEqual(error.data, {
				message: 'Async error via next!',
				func: 'errorFuncAsync',
			});
		}
	});

	it('should handle synchronous errors thrown within a function', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		try {
			await handler.handleRequest(func1, errorFuncSync, func3);
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.strictEqual(error.status, 500); // Default status
			assert.deepStrictEqual(error.data, {
				message: 'Sync error!',
				func: 'errorFuncSync',
			});
		}
	});

	it('should return success if no functions are provided', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		let result;
		try {
			result = await handler.handleRequest();
		} catch(e) {
			assert.fail(`Should not have thrown error: ${e.message}`);
		}

		assert.strictEqual(result.status, 200);
		assert.deepStrictEqual(result.data, {}); // No data added
	});

	it('should pass original event and context to functions', async () => {
		const handler = new SimpleHandler(mockEvent, mockContext);
		const checkEventContext = (data, next) => {
			assert.deepStrictEqual(data.event, mockEvent);
			assert.deepStrictEqual(data.context, mockContext);
			data.checked = true;
			next(null, data);
		};
		let result;
		try {
			result = await handler.handleRequest(checkEventContext);
		} catch(e) {
			assert.fail(`Should not have thrown error: ${e.message}`);
		}

		assert.strictEqual(result.status, 200);
		assert.deepStrictEqual(result.data, { checked: true });
	});

});