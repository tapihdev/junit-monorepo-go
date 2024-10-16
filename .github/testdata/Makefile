TARGET :=

.PHONY: test
test:
	cd "go/$(TARGET)" \
		&& gotestsum \
		--junitfile junit.xml \
		--junitfile-testcase-classname relative \
		--junitfile-testsuite-name relative  \
		./...

.PHONY: lint
lint:
	cd "go/$(TARGET)" \
		&& golangci-lint run \
		--out-format github-actions,junit-xml:lint.xml
