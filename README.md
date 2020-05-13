# FuzzyJS

This library is a lightweight fuzzy search implementation for JavaScript. It uses the following metrics to determine the similarity of two strings:

- Measure the edit distance between token pairs with the Damerau–Levenshtein algorithm
- Test token set intersections using the overlap coefficient formula
- N-gram hash table

All three metrics are used to produce a weighted similarity score.

## Dependencies

None, just vanilla JavaScript.

## Basic Usage

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
    edit_threshold : 0.6,   // Minimum edit score
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

## License

Code and documentation Copyright (c) 2019-2020 Keith Leonardo

Code released under the [BSD 3 License](https://choosealicense.com/licenses/bsd-3-clause/).