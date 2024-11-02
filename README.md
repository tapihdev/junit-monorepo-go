![LICENSE](https://img.shields.io/badge/license-MIT-blue.svg?maxAge=43200)
![Coverage](./badges/coverage.svg)
[![Codacy](https://app.codacy.com/project/badge/Grade/4fe2f49c3ab144b0bbe4effc85a061a0)](https://app.codacy.com/gh/tapihdev/junit-monorepo-go/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![CI](https://github.com/tapihdev/junit-monorepo-go/actions/workflows/ci.yml/badge.svg)](https://github.com/tj-actions/changed-files/actions/workflows/ci.yml)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/tapihdev/junit-monorepo-go?sort=semver)

# junit-monorepo-go

This action clearly displays the results of multi-module monorepos in Go by
commenting CI results to PRs and Actons summary pages.

| <img src="https://github.com/user-attachments/assets/e3638734-63df-48a7-8910-ab1fb37ae600"/> |
| :------------------------------------------------------------------------------------------: |

## Usage

### Directory structure

This action assumes that there are multiple Go modules in the monorepo with a
go.mod file for each module. JUnit test reports are generated with
[gotestsum](https://github.com/gotestyourself/gotestsum) and stored in the root
of each module.

```
go
├── app1
│   ├── pkg/
│   ├── go.mod
│   ├── lint.xml
│   └── test.xml
├── app2
│   ├── pkg/
│   ├── go.mod
│   ├── lint.xml
│   └── test.xml
└── app3
    ├── pkg/
    ├── go.mod
    ├── lint.xml
    └── test.xml
```

### Workflow

```yaml
name: Test
on:
  pull_request:
    branches:
      - main

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      fail-fast: false
      matrix:
        directory: ['go/app1', 'go/app2']
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      - name: Setup go
        uses: actions/setup-go@5
      - name: Install gotestsum
        run: go install gotest.tools/gotestsum@latest
      - name: Test
        id: test
        working-directory: ${{ matrix.directory }}
        env:
          directory: ${{ matrix.directory }}
        run: |-
          echo "name=$(echo "${directory}" | tr '/' '-')" >> "${GITHUB_OUTPUT}"
          gotestsum \
            --format github-actions \
            --junitfile test.xml \
            --junitfile-testcase-classname relative \
            --junitfile-testsuite-name relative \
            ./...
      - name: Lint
        id: lint
        working-directory: ${{ matrix.directory }}
        run: |-
          golangci-lint --out-format github-actions,junit-xml:lint.xml
      - name: Update artifacts
        uses: actions/upload-artifact@v4
        with:
          name: junit-${{ steps.test.outputs.name }}
          # ** preserves the directory structure
          path: |
            **/test.xml
            **/lint.xml

  report:
    name: Report
    runs-on: ubuntu-latest
    needs: test
    permissions:
      issues: write
      actions: write
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: junit-*
          merge-multiple: true
      - name: Comment PR
        uses: tapihdev/junit-monorepo-go@v0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          test-dirs: 'go/app1,go/app2'
          lint-dirs: 'go/app1,go/app2'
          test-report-xml: test.xml
          lint-report-xml: lint.xml
          pull-request-number: ${{ github.event.pull_request.number }}
          sha: ${{ github.pull_request.head.sha }}
```

### Inputs

| **Input**             | **Required** | **Description**                                                                                 |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `github-token`        | yes          | The GitHub token to use for authentication                                                      |
| `test-dirs`           | no           | The directories that contain the gotestsum reports (seperated by commas/spaces/line breaks)     |
| `lint-dirs`           | no           | The directories that contain the golangci-lint reports (seperated by commas/spaces/line breaks) |
| `test-report-xml`     | no           | The name of the JUnit report XML file (either this or `lint-report-xml` is required)            |
| `lint-report-xml`     | no           | The name of the lint report XML file (either this or `test-report-xml` is required)             |
| `pull-request-number` | yes          | The pull request number to comment on                                                           |
| `sha`                 | yes          | The commit SHA of the pull request                                                              |
| `failed-test-limit`   | no           | The number of failed tests to display (default: 30)                                             |
| `failed-lint-limit`   | no           | The number of failed lints to display (default: 30)                                             |

### Outputs

A full set list of possible output values for this action.

| **Output** | **Description**         |
| ---------- | ----------------------- |
| `body`     | The body of the comment |

### PR run permissions

This action requires the `issues: write` and `actions: write` permission to push
tags.
