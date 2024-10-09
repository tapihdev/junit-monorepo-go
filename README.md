# junit-monorepo-go

This action comments CI results of Go multi-module monorepo to a PR and a Actons
summary page.

## Setup

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
            --junitfile junit.xml \
            --junitfile-testcase-classname relative \
            --junitfile-testsuite-name relative \
            ./...
      - name: Update artifacts
        uses: actions/upload-artifact@v4
        with:
          name: junit-${{ steps.test.outputs.name }}
          path: '**/junit.xml'

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
          filename: junit.xml
          pull-request-number: ${{ github.event.pull_request.number }}
          sha: ${{ github.pull_request.head.sha }}
```

### Inputs

| **Input**             | **Required** | **Description**                            |
| --------------------- | ------------ | ------------------------------------------ |
| `github-token`        | yes          | The GitHub token to use for authentication |
| `filename`            | yes          | The filename of the JUnit test report      |
| `pull-request-number` | yes          | The pull request number to comment on      |
| `sha`                 | yes          | The commit SHA of the pull request         |
| `limit-failures`      | no           | The maximum number of failures to display  |

### Outputs

A full set list of possible output values for this action.

| **Output** | **Description**         |
| ---------- | ----------------------- |
| `body`     | The body of the comment |

### PR run permissions

This action requires the `issues: write` and `actions: write` permission to push
tags.
