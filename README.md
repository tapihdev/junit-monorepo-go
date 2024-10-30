# junit-monorepo-go

This action comments CI results of Go multi-module monorepo to a PR and a Actons
summary page.

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

### Configure the workflow

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
          directories: 'go/app1,go/app2'
          test-report-xml: test.xml
          lint-report-xml: lint.xml
          pull-request-number: ${{ github.event.pull_request.number }}
          sha: ${{ github.pull_request.head.sha }}
```

### Inputs

| **Input**             | **Required** | **Description**                                                                      |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `github-token`        | yes          | The GitHub token to use for authentication                                           |
| `directories`         | yes          | The directories to search for JUnit reports                                          |
| `test-report-xml`     | no           | The name of the JUnit report XML file (either this or `lint-report-xml` is required) |
| `lint-report-xml`     | no           | The name of the lint report XML file (either this or `test-report-xml` is required)  |
| `pull-request-number` | yes          | The pull request number to comment on                                                |
| `sha`                 | yes          | The commit SHA of the pull request                                                   |
| `failed-test-limit`   | no           | The number of failed tests to display (default: 30)                                  |
| `failed-lint-limit`   | no           | The number of failed lints to display (default: 30)                                  |

### Outputs

A full set list of possible output values for this action.

| **Output** | **Description**         |
| ---------- | ----------------------- |
| `body`     | The body of the comment |

### PR run permissions

This action requires the `issues: write` and `actions: write` permission to push
tags.
