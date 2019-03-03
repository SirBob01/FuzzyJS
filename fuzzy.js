function Fuzzy() {
	var self = this; // Keep context of parent prototype

	self.options = {
		sort : true,
		minCharLength : 2,
		maxDistance : 10,
		findAllMatches : false
	};

	self.distance = function(a, b) {
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

	self.score = function(a, b) {
		// Tokenizes strings and solves for total distance between words
		var a = a.split(" ");
		var b = b.split(" ");

		var m = a.length;
		var n = b.length;

		var sum = 0;

		/* If one is shorter, only calculate distance with
		subsection of the longer string */
		if(m <= n) {
			for(var i = 0; i < m; i++) {
				sum += self.distance(a[i], b[i]);
			}
		}
		if(n <= m) {	
			for(var i = 0; i < n; i++) {
				sum += self.distance(a[i], b[i]);
			}
		}
		return sum;
	}

	self.search = function(word, dict) {
		// Matches string against members of a dictionary
		var matches = [];
		if(word.length < self.options.minCharLength) {
			return [];
		}

		for(var i = 0; i < dict.length; i++) {
			var current_word = dict[i];
			var d = self.score(word, current_word);
			
			if(!self.options.findAllMatches && d == 0) {
				return [current_word];
			}

			if(d < self.options.maxDistance) {
				matches.push(current_word);
			}
		}

		if(self.options.sort) {
			matches.sort(function(a, b) {
				var dA = self.score(word, a);
				var dB = self.score(word, b);
				if(dA < dB) return -1;
				if(dB < dA) return 1;
				return 0;
			});		
		}
		return matches;
	}
}