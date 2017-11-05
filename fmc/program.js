
var ac = new (window.AudioContext || window.webkitAudioContext)();
graph = document.getElementById("graph");
endGraph = document.getElementById("endGraph");
diffGraph = document.getElementById("diffGraph")
// ------------------- Whistle Class ----------------------------
function Whistle() { // constructor function for the class Whilstle
	this.freq = 1000;
	this.atten = -24;
	this.gain = helpers.db2v(this.atten);
	this.tone = undefined; // placeholder for Web Audio Oscillator Node
	this.g = undefined; // placeholder for Web Audio Gain Node
};
Whistle.prototype.play = function() {
	// Create OscilatorNode
	var tone = ac.createOscillator();
	var g = ac.createGain();
	tone.frequency.value = this.freq;
	tone.connect(g);
	g.connect(ac.destination);
	g.gain.setValueAtTime(0, ac.currentTime);
	g.gain.linearRampToValueAtTime(this.gain, ac.currentTime + 0.1);
	tone.start(0);
	this.tone = tone;
	this.g = g;
};
Whistle.prototype.stop = function () {
	var currGain = this.g.gain.value;
	this.g.gain.setValueAtTime(currGain, ac.currentTime);
	this.g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.1);
	this.tone.stop(ac.currentTime + 0.2);
};
Whistle.prototype.setParam = function (freq,atten) {
	this.freq = freq;
	this.atten = atten;
	this.gain = helpers.db2v(atten);
};
Whistle.prototype.beep = function (dur) {
	dur = dur || 1000;
	this.play();
	window.setTimeout(this.stop.bind(this), dur);
};
// ------------------- TestFreq class ----------------------
function TestFreq(freq, atten) {
	this.freq = freq || 1000;
	this.inputHistory =  [];
	this.timesHeard = 0;
	this.maxXing = 3;
	this.currAtten = atten || -12;
	this.result = undefined;
	this.whistle = new Whistle();
};
TestFreq.prototype.beep = function (dur) {
	this.whistle.setParam(this.freq, this.currAtten);
	helpers.hideDiv("prompt");
	document.getElementById("freq").innerHTML = this.freq;
	document.getElementById("g").innerHTML = this.currAtten;
	this.whistle.beep(dur);
	window.setTimeout(helpers.showPrompt, 1000);
};
TestFreq.prototype.nidhi = function (beepLen) {
	this.currAtten += 3 / (this.timesHeard +1);
	if (this.currAtten >= 0) { // can't hear anything...
		this.result = [this.freq, 0];
		console.log(this.result);
		return this.result;			
	}
	this.inputHistory.unshift("n");
	this.beep(beepLen);
};
TestFreq.prototype.yihi = function (beepLen) {
	if (this.inputHistory[0] === "n") { // I just crossed my threshold from below
		this.timesHeard += 1;
		console.log(this.timesHeard);
		if (this.timesHeard >= this.maxXing) { // enough of this freq
			this.result = [this.freq, this.currAtten];
			console.log(this.result);
			return this.result;
		}
		this.inputHistory.unshift("y");
	}
	this.currAtten -= 9 / (this.timesHeard +1);
	this.beep(beepLen);
};

// ------------------- TestCurve Class ----------------------
function TestCurve(numSteps) {
	this.numSteps = numSteps || 12;
	this.testFreqList = helpers.expspace(80,16000,this.numSteps);
	this.results = [];
	this.currIdx = 0;
	this.currTest = undefined;
	this.curve = undefined; // [0] frequency, [1] user threshold, [2] F-M ideal threshold, [3] difference
	this.diff = undefined;
};

TestCurve.prototype.start = function (idx, atten) {
	this.currIdx = idx || 0;
	atten = atten || -12;
	this.currTest = new TestFreq(this.testFreqList[this.currIdx], atten);
	this.currTest.beep();
	// Change UI:
	helpers.showDiv("testUI");
	helpers.hideDiv("initUI");
};

TestCurve.prototype.nidhi = function () {  
	var result = this.currTest.nidhi();
	if (result !== undefined) {
		this.results.push(result);
		curve = helpers.T(this.results);
		Plotly.newPlot( graph, [{ x: curve[0], y: curve[1], mode: 'lines+markers' }] );
		console.log('calling incTest');
		this.incTest();
	}
};

TestCurve.prototype.yihi = function () {
	var result = this.currTest.yihi();
	if (result !== undefined) {
		this.results.push(result);
		curve = helpers.T(this.results);
		Plotly.newPlot( graph, [{ x: curve[0], y: curve[1], mode: 'lines+markers' }] );
		console.log('calling incTest');
		this.incTest();
	}
};

TestCurve.prototype.incTest = function () {
	if (this.currIdx >= this.numSteps - 1) {
		this.end();
	} else {
		this.currIdx += 1;
		var nextGain = this.currTest.result[1] + 12;
		nextGain = (nextGain > 0) ? -1 : nextGain; // never allow gain to past 0 dBFS
		console.log(nextGain);
		this.start(this.currIdx, nextGain);
	}
};

TestCurve.prototype.end = function () {
	console.log("end of the test.");
	helpers.hideDiv("testUI");
	helpers.showDiv("resultUI");
	// plot
	curve = helpers.T(this.results);
	curve[2] = [];
	for (i = 0; i < curve[0].length; i++) { // log the theoretical FMC and do diff
		curve[2].push(helpers.fmc(curve[0][i]) - 80);
	}
	this.curve = curve;
	this.normalize();
	// prep data for Plotly
	var userThresh = { 
		x: curve[0], 
		y: curve[1], 
		mode: "lines+markers", 
		name: "Your Threshold",
		line: {shape: "spline"}
	};
	var perfectThresh = {
		x: curve[0], 
		y: curve[2], 
		mode: "lines+markers", 
		name: "Theoretical Threshold",
		line: {shape: "spline", dash: 'dashdot'}
	};
	
	var layout1 = {
		title: "Hearing Threshold Test Result",
		xaxis: {title: "frequency (Hz)"},
		yaxis: {title: "threshold (dBFS)"}
	}
	Plotly.newPlot( endGraph, [userThresh, perfectThresh], layout1 ); 
	var diffThresh = {
		x: curve[0],
		y: helpers.arrayDiff(curve[1],curve[2]),
		mode: "lines",
		line: {shape: "spline"}
	}
	var layout2 = {
		title: "Recommanded Compensation EQ shape",
		xaxis: {title: "frequency (Hz)"},
		yaxis: {title: "gain (dB)"}
	}
	Plotly.newPlot( diffGraph, [diffThresh], layout2 ); 
};

TestCurve.prototype.normalize = function () {
	c = this.curve;
	diff = [];
	for (i = 0; i < c[0].length; i++) { // log the theoretical FMC and do diff
		diff.push(c[1][i] - c[2][i]);
	}
	offset = diff.reduce( function (a,b) {return a+b;} ) / c[0].length; // sum and devide
	for (i = 0; i < c[0].length; i++) { // log the theoretical FMC and do diff
		c[2][i] += offset;
		diff[i] -= offset;
	}
	this.diff = diff;
};

// ------------------- Helper Functions ----------------------
var helpers = {
	db2v: function (dB) { 
		return Math.pow(10, (dB/20));
	},

	v2db: function (v) {
		return 20*Math.log10(v);
	},

	expspace: function (min_freq, max_freq, steps) {
		var list = [];
		var r = max_freq / min_freq;
		var pole = Math.pow(r,1/(steps-1));
		for (i = 0; i < steps; i++) {
			list.push(min_freq*Math.pow(pole,i));
		}
		return list;
	},

	T: function(a) { // Transposes a 2d matrix. source: http://stackoverflow.com/questions/4492678/swap-rows-with-columns-transposition-of-a-matrix-in-javascript
	  // Calculate the width and height of the Array
	  var w = a.length ? a.length : 0,
	    h = a[0] instanceof Array ? a[0].length : 0;
	  // In case it is a zero matrix, no transpose routine needed.
	  if(h === 0 || w === 0) { return []; }
	  /**
	   * @var {Number} i Counter
	   * @var {Number} j Counter
	   * @var {Array} t Transposed data is stored in this array.
	   */
	  var i, j, t = [];
	  // Loop through every item in the outer array (height)
	  for(i=0; i<h; i++) {

	    // Insert a new row (array)
	    t[i] = [];

	    // Loop through every item per item in outer array (width)
	    for(j=0; j<w; j++) {

	      // Save transposed data.
	      t[i][j] = a[j][i];
	    }
	  }

	  return t;
	},
	
	fmc: function (f) { // Source: Bosi, page 155. Introduction to Digital Audio Coding and Standards
		return 3.64* Math.pow( (f/1000),-0.8) - 6.5*Math.exp(-0.6*Math.pow((f/1000-3.3),2)) + Math.pow(10,-3)*Math.pow(f/1000,4);
	},
	
	arrayDiff: function (a1, a2) {
		var out = [];
		for (i=0; i<a1.length; i++) {
			out.push(a1[i]-a2[i]);
		}
		return out;
	},
	
	showDiv: function (id) {document.getElementById(id).style.display = "block";},
	showPrompt: function () {document.getElementById("prompt").style.display = "block";},
	hideDiv: function (id) {document.getElementById(id).style.display = "none";},
	testLen: function (x) {
		document.getElementById("testLen").innerHTML = x;
		test = new TestCurve(x);
	}
	
};

