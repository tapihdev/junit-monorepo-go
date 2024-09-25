package arrayutils

// Max: 配列の中の最大値を返す
func Max(nums []int) int {
	if len(nums) == 0 {
		return 0 // 配列が空の場合は0を返す
	}
	max := nums[0]
	for _, num := range nums {
		if num > max {
			max = num
		}
	}
	return max
}
