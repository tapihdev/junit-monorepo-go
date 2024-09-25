package stringutils

import "strings"

// IsPalindrome: 文字列が回文かどうかをチェック
func IsPalindrome(s string) bool {
	s = strings.ToLower(s)
	for i := 0; i < len(s)/2; i++ {
		if s[i] != s[len(s)-i-1] {
			return false
		}
	}
	return true
}
