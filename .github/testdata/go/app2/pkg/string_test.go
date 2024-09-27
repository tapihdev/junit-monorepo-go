package stringutils

import (
	"testing"
)

func TestIsPalindrome(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Simple palindrome", "madam", true},
		{"Another palindrome", "racecar", true},
		{"Not a palindrome", "hello", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsPalindrome(tt.input)
			if result != tt.expected {
				t.Errorf("IsPalindrome(%s) = %v; want %v", tt.input, result, tt.expected)
			}
		})
	}
}
