---
title: "Days Until a Warmer Reading (Next Greater Element)"
description: "Monotonic decreasing stack of indices: for each day, how long until a strictly higher value."
url: "/interview-prep/practice/algorithms/26-daily-temperatures/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 26
---

# Days Until a Warmer Reading (Next Greater Element)

**Pattern:** Monotonic Stack · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Google

**Classic version:** [LeetCode 739](https://leetcode.com/problems/daily-temperatures/) · [LeetCode 496](https://leetcode.com/problems/next-greater-element-i/) · [LeetCode 503](https://leetcode.com/problems/next-greater-element-ii/)

## Problem

1. `days_until_warmer(temps)`: for each day `i`, return how many days you wait for a strictly warmer temperature, or `0` if none comes.
2. `next_greater_circular(nums)`: for each element, return the next strictly greater value when the array wraps around (after the last element comes the first), or `-1`.

## Examples

```text
days_until_warmer([73, 74, 75, 71, 69, 72, 76, 73]) → [1, 1, 4, 2, 1, 1, 0, 0]
next_greater_circular([1, 2, 1])                    → [2, -1, 2]
```

## Starter code

```python starter
def days_until_warmer(temps: list[int]) -> list[int]:
    pass


def next_greater_circular(nums: list[int]) -> list[int]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Keep a stack of indices still waiting for a warmer day. Their temperatures are decreasing from bottom to top.

</details>

<details><summary>Hint 2</summary>

When today's value beats the top of the stack, today is that index's answer: pop and record, repeat. Then push today.

</details>

<details><summary>Hint 3</summary>

Circular: loop over the indices twice (`i % n`) but only push during the first pass.

</details>

## Where this shows up in data engineering

"Time until the metric next exceeds its current value", "the next price above this one", "the next event with a higher sequence number". Monotonic stacks give O(n) answers for all of these, and the same idea powers efficient window max/min in stream processing (with a deque).

## Solution

```python solution
def days_until_warmer(temps):
    ans = [0] * len(temps)
    stack = []                                   # indices with decreasing temps
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            ans[j] = i - j
        stack.append(i)
    return ans


def next_greater_circular(nums):
    n = len(nums)
    ans = [-1] * n
    stack = []
    for i in range(2 * n):                        # second lap resolves wrap-around
        x = nums[i % n]
        while stack and nums[stack[-1]] < x:
            ans[stack.pop()] = x
        if i < n:
            stack.append(i)
    return ans
```

## Tests

Your solution should pass these:

```python tests
assert days_until_warmer([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]
assert days_until_warmer([30, 40, 50, 60]) == [1, 1, 1, 0]
assert days_until_warmer([30, 30, 30]) == [0, 0, 0]
assert days_until_warmer([]) == []
assert next_greater_circular([1, 2, 1]) == [2, -1, 2]
assert next_greater_circular([1, 2, 3, 4, 3]) == [2, 3, 4, -1, 4]
assert next_greater_circular([5, 5]) == [-1, -1]
```

## Explanation

**Invariant:** the stack holds indices whose answer is still unknown, with temperatures non-increasing from bottom to top. A new value resolves every waiting index with a smaller temperature, so those are popped.

**Why O(n):** each index is pushed once and popped at most once, so the inner `while` runs O(n) times in total, not per iteration.

**Choosing the comparison:** strictly greater → pop while `top < x`. For "next greater or equal", pop while `top <= x`. For next *smaller*, flip the comparison (increasing stack).

**Circular trick:** two passes over `i % n` let elements near the end see the beginning; pushing only in the first pass avoids duplicates.

## Follow-up questions

<details><summary>Previous greater element instead of next?</summary>

Scan left to right and, after popping smaller values, the remaining stack top is the previous greater. Or scan right to left with the 'next' logic.

</details>

<details><summary>Sliding-window maximum over the last k readings?</summary>

Monotonic deque of indices with decreasing values: pop from the back while smaller than the new value, pop from the front when it falls out of the window. The front is the max. O(n).

</details>
