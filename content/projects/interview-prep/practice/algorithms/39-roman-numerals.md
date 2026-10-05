---
title: "Roman Numerals: Parse and Format"
description: "Greedy table-driven conversion both ways, including subtractive pairs (IV, IX, XL, XC, CD, CM)."
url: "/interview-prep/practice/algorithms/39-roman-numerals/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 39
---

# Roman Numerals: Parse and Format

**Pattern:** Hashing, Stacks and Bit Tricks (Must-Know Classics) · **Difficulty:** Easy · **Asked at:** Amazon, Microsoft, Bloomberg, Adobe

**Classic version:** [LeetCode 13](https://leetcode.com/problems/roman-to-integer/) · [LeetCode 12](https://leetcode.com/problems/integer-to-roman/)

## Problem

1. `roman_to_int(s)`: convert a valid Roman numeral (1 to 3999) to an integer.
2. `int_to_roman(n)`: convert an integer in 1..3999 to its standard Roman numeral.

Symbols: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. A smaller symbol before a larger one is subtracted (IV=4, IX=9, XL=40, XC=90, CD=400, CM=900).

## Examples

```text
roman_to_int("III")      → 3
roman_to_int("LVIII")    → 58
roman_to_int("MCMXCIV")  → 1994
int_to_roman(1994)       → "MCMXCIV"
int_to_roman(3749)       → "MMMDCCXLIX"
```

## Starter code

```python starter
def roman_to_int(s: str) -> int:
    pass


def int_to_roman(n: int) -> str:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Parsing: scan left to right; if a symbol is smaller than the next one, subtract it, otherwise add it.

</details>

<details><summary>Hint 2</summary>

Formatting: a table of 13 values including the subtractive pairs, from 1000 down to 1. Greedily take the largest that fits.

</details>

## Where this shows up in data engineering

A small but realistic **parsing and formatting** task: table-driven conversions are how you write robust parsers for unit suffixes (`"1.5GB"`, `"250ms"`), cron fields or legacy codes. Interviewers watch for clean tables instead of `if/elif` ladders, and for a round-trip test.

## Solution

```python solution
VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
TABLE = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"),
         (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]


def roman_to_int(s: str) -> int:
    total = 0
    for i, ch in enumerate(s):
        v = VALUES[ch]
        if i + 1 < len(s) and v < VALUES[s[i + 1]]:
            total -= v                    # subtractive: IV, IX, XL, ...
        else:
            total += v
    return total


def int_to_roman(n: int) -> str:
    out = []
    for value, symbol in TABLE:
        count, n = divmod(n, value)
        out.append(symbol * count)
    return "".join(out)
```

## Tests

Your solution should pass these:

```python tests
assert roman_to_int("III") == 3
assert roman_to_int("LVIII") == 58
assert roman_to_int("MCMXCIV") == 1994
assert roman_to_int("IV") == 4 and roman_to_int("IX") == 9
assert int_to_roman(3) == "III"
assert int_to_roman(58) == "LVIII"
assert int_to_roman(1994) == "MCMXCIV"
assert int_to_roman(3749) == "MMMDCCXLIX"
assert all(roman_to_int(int_to_roman(n)) == n for n in range(1, 4000))
```

## Explanation

**Parsing rule:** a symbol is subtracted exactly when the next symbol is larger. One pass, O(n).

**Formatting:** including the six subtractive pairs in the table makes plain greedy correct; without them you'd need special cases. O(1) since the table is constant (at most ~15 output characters).

**Testing tip worth saying aloud:** a round-trip property test over the whole domain (1..3999) catches far more bugs than a handful of examples, and it's cheap here. The same idea applies to serialisers and parsers in pipelines.

## Follow-up questions

<details><summary>Validate that a string is a *canonical* Roman numeral (reject 'IIII', 'IC', 'VX').</summary>

Parse it, format the result, and compare with the input: canonical iff `int_to_roman(roman_to_int(s)) == s`. Or use the regex `^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$`.

</details>
