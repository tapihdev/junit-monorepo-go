import { Result } from '../type'

export function toResult(results: Result[]): Result {
    return results.some(result => result == Result.Failed) ? Result.Failed : Result.Passed
  }
