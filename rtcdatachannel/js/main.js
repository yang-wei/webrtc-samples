"use strict";

const startButton = document.getElementById("startButton");
const callButton = document.getElementById("callButton");
const hangupButton = document.getElementById("hangupButton");

startButton.addEventListener("click", startAction);
callButton.addEventListener("click", callAction);
hangupButton.addEventListener("click", hangupAction);

// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
	video: true,
};
const offerOptions = {
	offerToReceiveVideo: 1,
};

// Video element where stream will be placed.
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Local stream that will be reproduced on the video.
let localStream;
let remoteStream;

let localPeerConnection;

function handleConnection(event) {
	const targetConnection = event.target;
	if (event.candidate) {
		const candidate = new RTCIceCandidate(event.candidate);
		const otherPeer = getOtherPeer(targetConnection);
		otherPeer
			.addIceCandidate(candidate)
			.then(() => {
				handleConnectionSuccess(targetConnection);
			})
			.catch((error) => {
				handleConnectionFailure(targetConnection, error);
			});
	} else {
	}
}

let remotePeerConnection;

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
	console.log("navigator.getUserMedia error: ", error);
}

// Handles start button action: creates local MediaStream.
function startAction() {
	startButton.disabled = true;
	navigator.mediaDevices
		.getUserMedia(mediaStreamConstraints)
		.then(gotLocalMediaStream)
		.catch(handleLocalMediaStreamError);
	trace("Requesting local stream.");
}

function gotLocalMediaStream(mediaStream) {
	localVideo.srcObject = mediaStream;
	localStream = mediaStream;
	callButton.disabled = false;
}

function handleLocalMediaStreamError(error) {
	trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

function callAction() {
	callButton.disabled = true;
	hangupButton.disabled = false;
	trace("Starting call.");

	localPeerConnection = new RTCPeerConnection();
	localPeerConnection.onicecandidate = handleConnection;
	localPeerConnection.onconnectionstatechange = handleConnectionChange;
	for (const t of localStream.getTracks()) {
		localPeerConnection.addTrack(t, localStream);
	}

	remotePeerConnection = new RTCPeerConnection();
	remotePeerConnection.onicecandidate = handleConnection;
	remotePeerConnection.onconnectionstatechange = handleConnectionChange;
	remotePeerConnection.ontrack = gotRemoteMediaStream;

	trace("localPeerConnection createOffer start.");
	localPeerConnection
		.createOffer(offerOptions)
		.then(createdOffer)
		.catch(setSessionDescriptionError);
}

function hangupAction() {
	localPeerConnection.close();
	remotePeerConnection.close();
	localPeerConnection = null;
	remotePeerConnection = null;
	hangupButton.disabled = true;
	callButton.disabled = false;
}

// Logs offer creation and sets peer connection session descriptions.
function createdOffer(description) {
	trace(`Offer from localPeerConnection:\n${description.sdp}`);

	trace("localPeerConnection setLocalDescription start.");
	localPeerConnection
		.setLocalDescription(description)
		.then(() => {
			setLocalDescriptionSuccess(localPeerConnection);
		})
		.catch(setSessionDescriptionError);

	trace("remotePeerConnection setRemoteDescription start.");
	remotePeerConnection
		.setRemoteDescription(description)
		.then(() => {
			setRemoteDescriptionSuccess(remotePeerConnection);
		})
		.catch(setSessionDescriptionError);

	trace("remotePeerConnection createAnswer start.");
	remotePeerConnection
		.createAnswer()
		.then(createdAnswer)
		.catch(setSessionDescriptionError);
}

// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description) {
	trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

	trace("remotePeerConnection setLocalDescription start.");
	remotePeerConnection
		.setLocalDescription(description)
		.then(() => {
			setLocalDescriptionSuccess(remotePeerConnection);
		})
		.catch(setSessionDescriptionError);

	trace("localPeerConnection setRemoteDescription start.");
	localPeerConnection
		.setRemoteDescription(description)
		.then(() => {
			setRemoteDescriptionSuccess(localPeerConnection);
		})
		.catch(setSessionDescriptionError);
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event) {
	const mediaStream = event.streams[0];
	remoteVideo.srcObject = mediaStream;
	remoteStream = mediaStream;
	trace("Remote peer connection received remote stream.");
}

// Logs changes to the connection state.
function handleConnectionChange(event) {
	const peerConnection = event.target;
	trace(
		`${getPeerName(peerConnection)} ICE state: ` +
			`${peerConnection.iceConnectionState}.`
	);
}

// Logs that the connection succeeded.
function handleConnectionSuccess(peerConnection) {
	trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
}

// Logs that the connection failed.
function handleConnectionFailure(peerConnection, error) {
	trace(
		`${getPeerName(peerConnection)} failed to add ICE Candidate:\n` +
			`${error.toString()}.`
	);
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error) {
	trace(`Failed to create session description: ${error.toString()}.`);
}

// Logs success when setting session description.
function setDescriptionSuccess(peerConnection, functionName) {
	const peerName = getPeerName(peerConnection);
	trace(`${peerName} ${functionName} complete.`);
}

// Logs success when localDescription is set.
function setLocalDescriptionSuccess(peerConnection) {
	setDescriptionSuccess(peerConnection, "setLocalDescription");
}

// Logs success when remoteDescription is set.
function setRemoteDescriptionSuccess(peerConnection) {
	setDescriptionSuccess(peerConnection, "setRemoteDescription");
}

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
	text = text.trim();
	const now = (window.performance.now() / 1000).toFixed(3);
	console.log(now, text);
}

// Gets the "other" peer connection.
function getOtherPeer(peerConnection) {
	return peerConnection === localPeerConnection
		? remotePeerConnection
		: localPeerConnection;
}

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
	return peerConnection === localPeerConnection
		? "localPeerConnection"
		: "remotePeerConnection";
}
