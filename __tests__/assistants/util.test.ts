import { testFunc } from "@/src/assistants/util";

describe('testFunc', () => {
  test('call testFunc', () => {

    expect(testFunc()).toEqual("hello");
  });
});