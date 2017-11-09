var qx = { // An object (using my inital) to store all my global variables.
	windingAudio: document.getElementById("aWinding"),
	audioElement1: document.getElementById("aBox1"),
	audioElement2: document.getElementById("aBox2"),
	audioElement3: document.getElementById("aBox3"),
	fadeInterval: undefined, // this and the next two are for setInterval and setTimout handles, so I can clear them when needed.
	endMusicTimeout: undefined,
	interfaceTimeout: undefined
}; 
var qx_timer = { // A timer object
	// Properties
	startTime: undefined,
	stopTime: undefined,
	duration: undefined,
	// Methods:
	start: function () {
		this.startTime = new Date();
		this.stopTime = undefined;
		this.duration = undefined;
	},
	stop: function () {
		this.stopTime = new Date();
		this.duration = this.stopTime - this.startTime;
		return this.duration;
	}
};

// Button Actions: functions accessible by HTML
function windingMouseDown() {
	qx.windingAudio.currentTime = 0;
	qx.windingAudio.play();
	qx_timer.start();
	document.getElementById("pTimer").innerHTML = "Winding up the music box...";
}
function windingMouseUp() {
	qx.windingAudio.pause();
	var dur = qx_timer.stop(); // the stop() method returns the timed duration from qx_timer object.
	interfaceToPlayState();
	playMusic(dur); // dur: how long it's gonna play
	document.getElementById("pTimer").innerHTML = ("The music box is wound-up! with winding time " + dur + "ms.");
}
function resetClick() { // clear scheduled event and end immdeiatly
	clearTimeout(qx.endMusicTimeout);
	clearTimeout(qx.interfaceTimeout);
	endMusic();
	document.getElementById("pTimer").innerHTML = "Resetting.....";
	setTimeout(interfaceToWindingState, 1200);
}

// Audio Playback State Management
function playMusic(dur) { // dur is given by the timer.
	randomizePlayhead();
	startPlayer();
	qx.endMusicTimeout = setTimeout(endMusic, dur);
	qx.interfaceTimeout = setTimeout(interfaceToWindingState, dur+1200);
}
function endMusic() { // a nice fade out. needs time to execute
	qx.fadeInterval = setInterval(fade, 30);
	setTimeout(stopPlayer, 1000);
}

// Audio Helper functions
function startPlayer() {
	qx.audioElement1.volume = 1;
	qx.audioElement2.volume = 1;
	qx.audioElement3.volume = 1;
	qx.audioElement1.play();
	qx.audioElement2.play();
	qx.audioElement3.play();
}
function stopPlayer() {
	qx.audioElement1.pause();
	qx.audioElement2.pause();
	qx.audioElement3.pause();
	clearInterval(qx.fadeInterval);
}
function fade() {
	qx.audioElement1.volume *= 0.85;
	qx.audioElement2.volume *= 0.85;
	qx.audioElement3.volume *= 0.85;
	//document.getElementById("pTimer").innerHTML = qx.audioElement1.volume;
}
function randomizePlayhead() {
	qx.audioElement1.currentTime = qx.audioElement1.duration * Math.random();
	qx.audioElement2.currentTime = qx.audioElement2.duration * Math.random();
	qx.audioElement3.currentTime = qx.audioElement3.duration * Math.random();
}

// User Interface State Management
function interfaceToPlayState() {
	document.getElementById("bReset").hidden = false;
	document.getElementById("bWind").hidden = true;
	document.getElementById("iBox").src = "http://www.noiseaddicts.com/wp-content/uploads/2013/03/disc_music_box.jpg";
}
function interfaceToWindingState() {
	document.getElementById("bReset").hidden = true;
	document.getElementById("bWind").hidden = false;
	document.getElementById("pTimer").innerHTML = "";
	document.getElementById("iBox").src = "http://musicboxrestorations.com/wp-content/uploads/2013/08/small-cylinder-box-closed.png";
}