# FuzzyJS

A lightweight fuzzy search algorithm that calculates a weighted similarity score between two strings.

# Dependencies

None. Pure JavaScript.

# Basic Usage

1. Create a new `Fuzzy()` object.
```js
var fuzzy = new Fuzzy();
```

2. Set the parameters for the search.
```js
fuzzy.options = {
    sort : true,            // Sort result by score
    n_size : 3,             // N-gram size
    min_query : 2,          // Minimum query length
    min_similarity : 0.6,   // Threshold similarity score
    all_matches : true      // Return all potential matches?
};
```

3. Index the search space into the fuzzy engine.
```js
var keys = ["Hello", "Helper", "world", "bob"];
fuzzy.index(keys);
```

4. Search for a query and get an array of matches.
```js
var results = fuzzy.search(keys, "Hel"); // ["Hello", "Helper"]
```