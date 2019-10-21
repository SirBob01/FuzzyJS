# FuzzyJS

A lightweight fuzzy search implementation for JavaScript. It uses the Overlap coefficient for an intersection test, the Damerau–Levenshtein algorithm to measure the edit distance between token pairs, and an n-gram hashtable to probabilistically determine the total weighted similarity score.

# Dependencies

None. Pure JavaScript.

# Basic Usage

1. Create a new `Fuzzy()` object.
```js
var fuzzy = new Fuzzy();
```

2. Set the parameters for the search. The scores calculated by the engine range from 0 (completely different) to 1.0 (exact match).
```js
fuzzy.options = {
    sort : true,            // Sort results by final score
    n_size : 3,             // N-gram size
    min_query : 2,          // Minimum query length
    score_threshold : 0.4,  // Minimum total similarity score
    edit_threshold : 0.8,   // Minimum edit score
    all_matches : true      // Return all potential matches?
};
```

3. Index the search space into the Fuzzy engine.
```js
var keys = ["Hello", "Helper", "world", "bob"];
fuzzy.index(keys);
```

4. Search for a query and get an array of matches.
```js
var results = fuzzy.search("hell"); // ["Hello", "Helper"]
```