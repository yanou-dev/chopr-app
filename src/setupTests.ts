import "@testing-library/jest-dom";

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

  const expect: any;
  const test: any;
  const describe: any;
  const beforeEach: any;
  const afterEach: any;
  const beforeAll: any;
  const afterAll: any;
  const jest: any;
}
