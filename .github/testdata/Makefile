TARGET :=

.PHONY: test
test:
	cd "go/$(TARGET)" \
		&& gotestsum \
		--junitfile junit.xml \
		--junitfile-testcase-classname relative \
		--junitfile-testsuite-name relative  \
		./...
