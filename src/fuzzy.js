function Fuzzy() {
	var self = this; // Keep context of parent prototype
	self.gram_db = {};
	self.options = {
		sort : true,
		nGram : 3,
		minCharLength : 2,
		maxDistance : 0.4,
		enableDamLev : true,
		findAllMatches : false
	};

	self.normalize = function(string) {
		// Removes all non-alphanumeric characters
		return string.toLowerCase().replace(/(\W)+/g,'');
	}

	self.index = function(dict) {
		// Pre-process dictionary for fast n-gram search
		self.gram_db = {};
		var n = self.options.nGram;

		for(var i = 0; i < dict.length; i++) {	
			var phrase = self.normalize(dict[i]);
			for(var j = 0; j < phrase.length-n+1; j++) {
				var gram = phrase.slice(j, j+n);
				if(gram in self.gram_db && phrase in self.gram_db[gram]) {
					self.gram_db[gram][phrase]++;
				}
				else {
					self.gram_db[gram] = {};
					self.gram_db[gram][phrase] = 1;
				}
			}
		}
	}

	self.gram_counter = function(phrase) {
		// Calculates local n-grams of query phrase
		var phrase = self.normalize(phrase);
		var grams = {};
		var n = self.options.nGram;

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

		var matrix = new Array(m+1)
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
				matrix[i][j] = Math.min(matrix[i-1][j]+1,
										matrix[i][j-1]+1,
										matrix[i-1][j-1]+cost
				);
				if(i > 1 && j > 1 && a[i-1] == b[j-2] && a[i-2] == b[j-1]) {
					matrix[i][j] = Math.min(matrix[i][j],
									   		matrix[i-2][j-2]+cost
					);
				}
			}
		}

		return matrix[m-1][n-1];
	}

	self.n_gram = function(key, query) {
		// Compares word structure of two sentences
		// Vectorizes strings and calculates cosine similarity
		// Returns (a.b)/(|a||b|)
		var q_grams = self.gram_counter(query);
		var k_phrase = self.normalize(key);
		
		var dot = 0;
		var a_mag = 0;
		var b_mag = 0;

		for(var g in q_grams) {
			if(g in self.gram_db && k_phrase in self.gram_db[g]) {
				dot += q_grams[g]*self.gram_db[g][k_phrase];

				a_mag += Math.pow(q_grams[g], 2);
				b_mag += Math.pow(self.gram_db[g][k_phrase], 2);
			}
		}
		if(a_mag*b_mag == 0) return 0; // Completely different strings
		else return dot/Math.sqrt(a_mag*b_mag);
	}

	self.edit_similarity = function(key, query) {
		// Normalize
		var k_t = key.split(" ");
		var q_t = query.split(" ");

		// b_t needs to be the shorter sequence
		if(q_t.length > k_t.length) {
			var temp = q_t;
			q_t = k_t;
			k_t = temp;
		}

		var long = k_t.length;
		var short = q_t.length;

		var similarity = 0; // Assume strings are completely different
		// Not sure how to optimize, worst case is O(long*short)
		// Negligible for short queries, I guess?
		for(var i = 0; i < long-short+1; i++) {
			var substring = k_t.slice(i, i+short);
			var local_distance = 0;
			for(var j = 0; j < short; j++) {
				var dist = self.damlev_distance(substring[j], q_t[j]);
				var norm = Math.max(substring[j].length, q_t[j].length);
				local_distance += dist/norm;
			}
			if(local_distance/short < self.options.maxDistance) {
				similarity = 1-(local_distance/short);
				break;
			}
		}
		return similarity;
	}

	self.compare = function(key, query) {
		// Takes into account comparison operators (n-gram, edit distance)
		var gram = self.n_gram(key, query);
		if(self.options.enableDamLev) {
			var edit = self.edit_similarity(key, query);
	
			// Prioritize n-gram because edits only account for misspellings
			var score = edit*0.35 + gram*0.65;
		}
		else {
			var score = gram;
		}
		return score;
	}

	self.search = function(dict, query) {
		var matches = [];
		if(query.length < self.options.minCharLength) return dict;

		// Matches string against members of a dictionary
		for(var i = 0; i < dict.length; i++) {
			var current = dict[i];
			var s = self.compare(current, query);
			
			if(s > 1-self.options.maxDistance) {
				matches.push(current);
			}
		}

		if(self.options.sort) {
			matches.sort(function(a, b) {
				var sA = self.compare(a, query);
				var sB = self.compare(b, query);
				if(sA < sB) return 1;
				if(sB < sA) return -1;
				return 0;
			});
		}

		if(matches.length == 0) return dict;

		if(self.options.findAllMatches) {
			return matches;
		}
		else {
			return [matches[0]];
		}
	}
}