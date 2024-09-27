package arrayutils

import (
	"testing"
)

func TestMax(t *testing.T) {
	tests := []struct {
		name     string
		input    []int
		expected int
	}{
		{"Normal case", []int{1, 2, 3, 4, 5}, 5},
		{"All negative numbers", []int{-1, -5, -3, -4}, -1},
		{"Single element", []int{7}, 7},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Max(tt.input)
			if result != tt.expected {
				t.Errorf("Max(%v) = %d; want %d", tt.input, result, tt.expected)
			}
		})
	}
}
