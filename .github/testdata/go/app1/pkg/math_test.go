package math

import (
	"testing"
)

func TestSquare(t *testing.T) {
	tests := []struct {
		name     string
		input    int
		expected int
	}{
		{"Positive number", 2, 4},
		{"Another positive number", 3, 9},
		{"Negative number", -4, 16},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Square(tt.input)
			if result != tt.expected {
				t.Errorf("Square(%d) = %d; want %d", tt.input, result, tt.expected)
			}
		})
	}
}
