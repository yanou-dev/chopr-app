// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// This file is used by Create React App to set up the test environment
// It's automatically included before each test file is executed

// Ensure global test variables are available in TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      expect: any;
      test: any;
      describe: any;
      beforeEach: any;
      afterEach: any;
      beforeAll: any;
      afterAll: any;
      jest: any;
    }
  }

  // Add these to the global scope as well
  const expect: any;
  const test: any;
  const describe: any;
  const beforeEach: any;
  const afterEach: any;
  const beforeAll: any;
  const afterAll: any;
  const jest: any;
}
