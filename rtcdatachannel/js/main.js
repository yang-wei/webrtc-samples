"use strict";

let localConnection;
let remoteConnection;

let sendChannel;
let receiveChannel;

const dataChannelSend = document.querySelector("textarea#dataChannelSend");
const dataChannelReceive = document.querySelector(
  "textarea#dataChannelReceive"
);

const startButton = document.querySelector("button#startButton");
const sendButton = document.querySelector("button#sendButton");
const closeButton = document.querySelector("button#closeButton");

startButton.onclick = createConnection;

function createConnection(event) {
  dataChannelSend.placeholder = "";

  // create remote connection
  remoteConnection = new RTCPeerConnection();
  remoteConnection.onicecandidate = handleRemoteConnection;
  remoteConnection.ondatachannel = handleOnDataChannel;

  // create local connection
  localConnection = new RTCPeerConnection();
  localConnection.onicecandidate = handleLocalConnection;
  sendChannel = localConnection.createDataChannel("sendDataChannel");
  sendChannel.onopen = handleConnectionChange;
  sendChannel.onclose = handleConnectionChange;

  localConnection
    .createOffer()
    .then(gotLocalDescription)
    .catch(onCreateSessionDescriptionError);

  startButton.disabled = true;
  closeButton.disabled = false;
}

function gotLocalDescription(desc) {
  localConnection.setLocalDescription(desc);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection
    .createAnswer()
    .then(gotRemoteDescription)
    .catch(onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  trace("Failed to create session description: " + error.toString());
}

function gotRemoteDescription(desc) {
  remoteConnection.setLocalDescription(desc);
  localConnection.setRemoteDescription(desc);
}

function handleOnDataChannel(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace("Received Message");
  dataChannelReceive.value = event.data;
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace("Receive channel state is: " + readyState);
}

function handleLocalConnection(event) {
  const targetConnection = event.target;
  if (event.candidate) {
    remoteConnection
      .addIceCandidate(event.candidate)
      .then(() => {
        handleConnectionSuccess(targetConnection);
      })
      .catch((error) => {
        handleConnectionFailure(targetConnection, error);
      });
  }
}
function handleRemoteConnection(event) {
  const targetConnection = event.target;
  if (event.candidate) {
    localConnection
      .addIceCandidate(event.candidate)
      .then(() => {
        handleConnectionSuccess(targetConnection);
      })
      .catch((error) => {
        handleConnectionFailure(targetConnection, error);
      });
  }
}

startButton.onclick = createConnection;
sendButton.onclick = sendData;

function sendData() {
  var data = dataChannelSend.value;
  sendChannel.send(data);
  trace("Sent Data: " + data);
}

closeButton.onclick = closeDataChannels;

function closeDataChannels() {
  sendChannel.close();
  receiveChannel.close();
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = "";
  dataChannelReceive.value = "";
  dataChannelSend.disabled = true;
}

// Logs changes to the connection state.
function handleConnectionChange(event) {
  const readyState = sendChannel.readyState;

  if (readyState === "open") {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
  trace("Send channel state is: " + readyState);
}

// Logs that the connection succeeded.
function handleConnectionSuccess(peerConnection) {
  trace(`addIceCandidate success.`);
}

// Logs that the connection failed.
function handleConnectionFailure(peerConnection, error) {
  trace(`failed to add ICE Candidate:\n` + `${error.toString()}.`);
}

function trace(text) {
  if (text[text.length - 1] === "\n") {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ": " + text);
  } else {
    console.log(text);
  }
}
