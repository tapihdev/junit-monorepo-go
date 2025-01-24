export enum Result {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Unknown = 'unknown'
}

export enum ReporterType {
  GolangCILint = 'golangci-lint',
  Gotestsum = 'gotestsum'
}

export type GitHubContext = {
  owner: string
  repo: string
  sha: string
}
