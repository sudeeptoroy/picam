'use strict';

// Put variables in global scope to make them available to the browser console.
const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
const snapShotSend = document.getElementById('snapShotSend');
const captureOutput = document.getElementById('captureOutput');

snapShotSend.onclick = function() {
	var fileType = "image/png";
	var maxWidth = 800;
	var maxHeight = 800;

	var width = video.videoWidth;
	var height = video.videoHeight;

	var newWidth;
	var newHeight;

	if (width > height) {
		newHeight = height * (maxWidth / width);
		newWidth = maxWidth;
	} else {
		newWidth = width * (maxHeight / height);
		newHeight = maxHeight;
	}

	canvas.width = newWidth;
	canvas.height = newHeight;

	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
	snapShotSend.disabled = true;
	var dataURL = canvas.toDataURL(fileType);
	dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "")
	sendFile(dataURL,fileType);
	sleep(5000).then(() => {
		snapShotSend.disabled = false;

	});
};

function sendFile(dataURL,fileType) {

	var time =new Date();
	time=time.getTime();

	var extn = fileType.substring(fileType.lastIndexOf("/")+1);
	var fileName= time+"."+extn;


	$.ajax({
		type: "POST",
		url: "/api/captures",
		data: { 
			imgBase64: dataURL,
			fileType:fileType,
			fileName:fileName
		}
	}).done(function(o) {
		console.log('saved'); 

	});
	updateDisplay();
};

function sleep(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
}

var gcount = 0;

function updateDisplay() {
	var url = "/lastResult";
	captureOutput.textContent = "checking...";
	snapShotSend.disabled = true;
	gcount += 1;
	if (gcount % 4 == 0) {
		captureOutput.textContent = "oops";
		gcount = 0;
		snapShotSend.disabled = false;
		return;
	}
	fetch(url).then(function(response) {
		response.text().then(function(text) {
			if (text == null || text == '') {
				console.log("trying in 1 sec");
				sleep(1000).then(() => {
					updateDisplay();
				});
			} else {
				captureOutput.textContent = 'result:' + text;
				snapShotSend.disabled = false;
				gcount = 0;
			}
		});
	});
};

/*
snapShotSend.onclick = function() {
  var dataURL = canvas.toDataURL("image/png");
  var request = new XMLHttpRequest();
  request.open("POST", "api/captures");
//request.setRequestHeader('content-type', 'multipart/form-data');
//request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  request.send(JSON.stringify(dataURL));
}
*/

const constraints = {
	audio: false,
	video: true
};

function handleSuccess(stream) {
	window.stream = stream; // make stream available to browser console
	video.srcObject = stream;
}

function handleError(error) {
	console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
