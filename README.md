# tag-major-minor-semver

This action annotates major and minor version tags with the corresponding semver version, which is
useful for releasing GitHub Actions actions.

## Setup

### Configure the workflow

```yaml
name: release
on:
  push:
    tags:
      - "v*.*.*"

jobs:
  release:
    name: Release action
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      - name: Annotate major and minor version
        uses: tapih/tag-major-minor-semver@v1
```

### Inputs

| **Input** | **Required** | **Description**            |
| --------- | ------------ | -------------------------- |
| `tag`     | no           | The semver tag to annotate |

### Outputs

A full set list of possible output values for this action.

| **Output** | **Description**               |
| ---------- | ----------------------------- |
| `minor`    | The minor version (e.g. v1.0) |
| `major`    | The major version (e.g. v1)   |

### PR run permissions

This action requires the `contents: write` permission to push tags.
