'use strict';

// Put variables in global scope to make them available to the browser console.
const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
const snapShotSend = document.getElementById('snapShotSend');

snapShotSend.onclick = function() {
	var fileType = "image/png";
	var maxWidth = 200;
	var maxHeight = 200;

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
	var dataURL = canvas.toDataURL(fileType);
	dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "")
	sendFile(dataURL,fileType);
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
