function Fuzzy() {
    var self = this; // Keep context of parent prototype
    self.gram_db = {};
    self.options = {
        sort : true,
        n_size : 3,
        min_query : 2,
        score_threshold : 0.4,
        edit_threshold : 0.8,
        all_matches : true
    };

    self.normalize = function(string) {
        // Lowercase and no whitespace
        var norm = string.toLowerCase().replace(/\s/g, '');
        return norm;
    }

    self.index = function(dict) {
        // Pre-process dictionary for fast n-gram search
        self.gram_db = {};
        var n = self.options.n_size;

        for(var i = 0; i < dict.length; i++) {
            self.gram_db[dict[i]] = {};

            phrase = self.normalize(dict[i]);
            for(var j = 0; j < phrase.length-n+1; j++) {
                var gram = phrase.slice(j, j+n);

                if(gram in self.gram_db[dict[i]]) {
                    self.gram_db[dict[i]][gram]++;
                }
                else {
                    self.gram_db[dict[i]][gram] = 1;
                }
            }
        }
    }

    self.reset = function() {
        // Reset the local dictionary
        self.gram_db = {};
    }

    self.gram_counter = function(phrase) {
        // Calculates n-grams of a phrase
        var phrase = self.normalize(phrase);
        var n = self.options.n_size;
        var grams = {};

        for(var i = 0; i < phrase.length-n+1; i++) {
            g = phrase.slice(i, i+n);
            if(g in grams) {
                grams[g]++;
            }
            else {
                grams[g] = 1;
            }
        }
        return grams;
    }

    self.damlev_distance = function(a, b) {
        // Damerau-Levenshtein distance
        var a = a.toLowerCase();
        var b = b.toLowerCase();

        var m = a.length;
        var n = b.length;
        
        if(m == 0) return n;
        if(n == 0) return m;

        var matrix = new Array(m+1);
        for(var i = 0; i <= m; i++) {
            matrix[i] = new Array(n+1).fill(0);
        }
        
        for(var i = 1; i <= m; i++) {
            matrix[i][0] = i;
        }
        for(var j = 1; j <= n; j++) {
            matrix[0][j] = j;
        }
        
        for(var j = 1; j <= n; j++) {
            for(var i = 1; i <= m; i++) {
                if(a[i-1] == b[j-1]) {
                    cost = 0;
                }
                else {
                    cost = 1;
                }
                matrix[i][j] = Math.min(
                    matrix[i-1][j]+1,
                    matrix[i][j-1]+1,
                    matrix[i-1][j-1]+cost
                );
                if(i > 1 && j > 1 && a[i-1] == b[j-2] && a[i-2] == b[j-1]) {
                    matrix[i][j] = Math.min(
                        matrix[i][j],
                        matrix[i-2][j-2]+cost
                    );
                }
            }
        }

        return matrix[m-1][n-1];
    }

    self.n_gram = function(key, query) {
        // Compares structure of two normalized strings
        // Vectorizes strings and calculates cosine similarity
        var q_grams = self.gram_counter(query);
        
        var dot = 0;
        var a_mag = 0;
        var b_mag = 0;

        for(var g in q_grams) {
            a_mag += Math.pow(q_grams[g], 2);
            
            if(key in self.gram_db) {
                b_mag += Math.pow(self.gram_db[key][g], 2);

                if(g in self.gram_db[key]) {
                    dot += q_grams[g]*self.gram_db[key][g];
                }
            } 
        }
        
        var mag_prod = a_mag*b_mag;
        if(mag_prod == 0) {
            return 0; // Completely different strings  
        } 
        else {
            return dot/Math.sqrt(mag_prod);  
        } 
    }

    self.jaccard_index = function(a, b) {
        // Proportion of the intersection of two strings
        var tokens_a = a.split(" ");
        var tokens_b = b.split(" ");

        // Unique tokens of each string
        var set_a = [];
        var set_b = [];

        for(var i = 0; i < tokens_a.length; i++) {
            var t = tokens_a[i];
            if(!set_a.includes(t)) {
                set_a.push(t);
            }
        }
        
        for(var i = 0; i < tokens_b.length; i++) {
            var t = tokens_b[i];
            if(!set_b.includes(t)) {
                set_b.push(t);
            }
        }

        var intersection = 0;
        var total = set_a.length + set_b.length;

        for(var i = 0; i < set_a.length; i++) {
            for(var j = 0; j < set_b.length; j++) {
                var t_a = set_a[i];
                var t_b = set_b[j];

                // Test token pair similarity
                var dist = self.damlev_distance(t_a, t_b);
                var norm = Math.max(t_a.length, t_b.length);
                
                if(dist/norm < 1-self.options.edit_threshold) {
                    intersection++;
                }
            }
        }

        return intersection / (total - intersection);
    }

    self.compare = function(key, query) {
        // Takes into account comparison operators
        var grams = self.n_gram(key, query);
        var intersection = self.jaccard_index(key, query);

        // Final score
        var score = (intersection + grams) / 2;
        return score;
    }

    self.search = function(query) {
        var dict = Object.keys(self.gram_db);
        var scores = {};
        var matches = [];

        if(query.length < self.options.min_query || dict.length == 0) {
            return [];
        }

        // Matches string against members of a dictionary
        for(var i = 0; i < dict.length; i++) {
            var current = dict[i];
            scores[current] = self.compare(current, query);
            if(scores[current] >= self.options.score_threshold) {
                matches.push(current);
            }
        }

        if(self.options.sort) {
            matches.sort(function(a, b) {
                if(scores[a] < scores[b]) {
                    return 1;
                }
                if(scores[b] < scores[a]) {
                    return -1;
                }
                return 0;
            });
        }
        
        if(self.options.all_matches) {
            return matches;
        }
        else if(matches.length) {
            return [matches[0]];
        }
        else {
            return [];
        }
    }
}