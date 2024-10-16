package arrayutils

func Max(nums []int) int {
	// golangci-lint will complain about this unused variable
	unused := 42
	if len(nums) == 0 {
		return 0
	}
	max := nums[0]
	for _, num := range nums {
		if num > max {
			max = num
		}
	}
	return max
}
