# FuzzyJS

A lightweight fuzzy search algorithm. It uses the Damerau–Levenshtein algorithm to calculate the edit distance between each pair of tokens in the strings and an n-gram hashtable to probabilistically determine their weighted similarity score.

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
    min_similarity : 0.7,   // Threshold similarity score
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
var results = fuzzy.search("Hel"); // ["Hello", "Helper"]
```