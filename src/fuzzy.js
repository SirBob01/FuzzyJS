class Fuzzy {
    constructor() {
        this.gram_db = {};
        this.options = {
            sort : true,
            n_size : 3,
            min_query : 2,
            score_threshold : 0.4,
            edit_threshold : 0.6,
            all_matches : true
        };
    }

    normalize(string) {
        // Lowercase and no whitespace
        let norm = string.toLowerCase().replace(/\s/g, '');
        return norm;
    }

    index(dict) {
        // Pre-process dictionary for fast n-gram search
        let n = this.options.n_size;

        for(let i = 0; i < dict.length; i++) {
            if(dict[i] in this.gram_db) {
                continue;
            }

            this.gram_db[dict[i]] = {};
            let phrase = this.normalize(dict[i]);

            for(let j = 0; j < phrase.length-n+1; j++) {
                let gram = phrase.slice(j, j+n);

                if(gram in this.gram_db[dict[i]]) {
                    this.gram_db[dict[i]][gram]++;
                }
                else {
                    this.gram_db[dict[i]][gram] = 1;
                }
            }
        }
    }

    reset() {
        // Reset the local dictionary
        this.gram_db = {};
    }

    gram_counter(phrase) {
        // Calculates n-grams of a phrase
        phrase = this.normalize(phrase);
        let n = this.options.n_size;
        let grams = {};

        for(let i = 0; i < phrase.length-n+1; i++) {
            let g = phrase.slice(i, i+n);
            if(g in grams) {
                grams[g]++;
            }
            else {
                grams[g] = 1;
            }
        }
        return grams;
    }

    damlev_distance(a, b) {
        // Damerau-Levenshtein algorithm
        // Calculate edit distance between two strings
        a = a.toLowerCase();
        b = b.toLowerCase();

        let m = a.length;
        let n = b.length;
        
        if(m == 0) return n;
        if(n == 0) return m;

        let matrix = new Array(m+1);
        for(let i = 0; i <= m; i++) {
            matrix[i] = new Array(n+1).fill(0);
        }
        
        for(let i = 1; i <= m; i++) {
            matrix[i][0] = i;
        }
        for(let j = 1; j <= n; j++) {
            matrix[0][j] = j;
        }
        
        for(let j = 1; j <= n; j++) {
            for(let i = 1; i <= m; i++) {
                let cost;
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

    n_gram(key, query) {
        // Compares structure of two normalized strings
        // Vectorizes strings and calculates cosine similarity
        let q_grams = this.gram_counter(query);
        
        let dot = 0;
        let a_mag = 0;
        let b_mag = 0;

        for(let g in q_grams) {
            a_mag += Math.pow(q_grams[g], 2);

            if(key in this.gram_db && g in this.gram_db[key]) {
                dot += q_grams[g]*this.gram_db[key][g];
            } 
        }

        if(key in this.gram_db) {
            for(let g in this.gram_db[key]) {
                b_mag += Math.pow(this.gram_db[key][g], 2);
            }
        }
        
        let mag_prod = a_mag*b_mag;
        if(mag_prod == 0) {
            return 0; // Completely different strings  
        } 
        else {
            return dot/Math.sqrt(mag_prod);  
        } 
    }

    overlap_coefficient(a, b) {
        // Szymkiewicz–Simpson coefficient 
        // Calculates overlap proportion relative to the smaller string
        let tokens_a = a.split(" ");
        let tokens_b = b.split(" ");

        // Unique tokens of each string
        let set_a = [];
        let set_b = [];

        for(let i = 0; i < tokens_a.length; i++) {
            let t = tokens_a[i].toLowerCase();
            if(!set_a.includes(t)) {
                set_a.push(t);
            }
        }
        
        for(let i = 0; i < tokens_b.length; i++) {
            let t = tokens_b[i].toLowerCase();
            if(!set_b.includes(t)) {
                set_b.push(t);
            }
        }

        let intersection = 0;
        let rel = Math.min(set_a.length, set_b.length);

        for(let i = 0; i < set_a.length; i++) {
            for(let j = 0; j < set_b.length; j++) {
                let t_a = set_a[i];
                let t_b = set_b[j];

                // Test token pair similarity
                let dist = this.damlev_distance(t_a, t_b);
                let norm = Math.max(t_a.length, t_b.length);
                
                if(1-dist/norm >= this.options.edit_threshold) {
                    intersection++;
                }
            }
        }

        return intersection / rel;
    }

    compare(key, query) {
        // Takes into account comparison operators
        let grams = this.n_gram(key, query);
        let overlap = this.overlap_coefficient(key, query);

        // Final score
        let score = Math.sqrt(overlap*overlap + grams*grams) / 2;
        return score;
    }

    search(query) {
        let dict = Object.keys(this.gram_db);
        let scores = {};
        let matches = [];

        if(query.length < this.options.min_query || dict.length == 0) {
            return [];
        }

        // Matches string against members of a dictionary
        for(let i = 0; i < dict.length; i++) {
            let current = dict[i];
            scores[current] = this.compare(current, query);
            if(scores[current] >= this.options.score_threshold) {
                matches.push(current);
            }
        }

        if(this.options.sort) {
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
        
        if(this.options.all_matches) {
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

exports.Fuzzy = Fuzzy;