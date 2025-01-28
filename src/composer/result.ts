import { Result } from "../type";

export class ResultComposer {
  toResult(results: Result[]) {
    return results.some(result => result == Result.Failed) ? Result.Failed : Result.Passed
  }
}

