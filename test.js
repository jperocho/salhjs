const assert = require('assert');
const SimpleHandler = require('.');

describe('SimpleHandler', () => {
  describe('#handleRequest()', () => {
    it('should return a successful response', async () => {
      const handler = new SimpleHandler({ some: 'event' }, { some: 'context' });
    
      const func1 = (data, next) => {
        data.func1 = 'From func1';
        return next(null, data);
      };
    
      const func2 = (data, next) => {
        data.func2 = 'From func2';
        return next(null, data);
      };
    
      const func3 = (data, next) => {
        data.func3 = 'From func3';
        return next(null, data);
      };
    
      const { status, data } = await handler.handleRequest(func1, func2, func3);
      
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(data, {
        event: { some: 'event' },
        context: { some: 'context' },
        currentFunc: 'func3',
        func1: 'From func1',
        func2: 'From func2',
        func3: 'From func3'
      });
    });

    it('should return an error response', async () => {
      const handler = new SimpleHandler({ some: 'event' }, { some: 'context' });

      const func1 = (data, next) => {
        return next(new Error('Something went wrong'));
      };

      const { status, data } = await handler.handleRequest(func1);

      assert.strictEqual(status, 500);
      assert.deepStrictEqual(data, {
        message: 'Something went wrong',
        func: 'func1',
      });
    });
  });
});