var firebaseConfig = {
  apiKey: "AIzaSyDJRnhxeTIMNIHTqW6wHfvmVlY4kcDf3OY",
  authDomain: "webrtc-final-vpa.firebaseapp.com",
  databaseURL: "https://webrtc-final-vpa.firebaseio.com",
  projectId: "webrtc-final-vpa",
  storageBucket: "",
  messagingSenderId: "813986155632",
  appId: "1:813986155632:web:b205039e1d4e8d1e"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var serverConnection = 'default';
const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');
const conButton = document.getElementById('connectButton');
const sendButton = document.getElementById('sendButton');
const textArea = document.getElementById('inbox');
const textArea1 = document.getElementById('receive');
hangupButton.disabled = true;
var serverConnection = "default";
var localStream = "default";
var senttext = 'default';
var database = firebase.database().ref();
var yourId = Math.floor(Math.random()*1000000000);
console.log(yourId);
var peerConnection = new RTCPeerConnection(
  {'iceServers': [ {'urls': 'stun:stun.stunprotocol.org:3478'}, {'urls': 'stun:stun.l.google.com:19302'}, {'url': 'stun:stun.services.mozilla.com'}]}
);
startButton.addEventListener('click', start);
hangupButton.addEventListener('click', hangup);
conButton.addEventListener('click', showFriendsFace);
sendButton.addEventListener('click',textMessage);

peerConnection.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})):console.log('Sent All ICE'));
peerConnection.onaddstream = (event => remoteVideo.srcObject = event.stream);

function hangup(){
	localVideo.srcObject.getTracks()[1].stop();
  startButton.disabled = false;
  hangupButton.disabled = true;
}
function sendMessage(senderId, data) {
    var msg = database.push({ sender: senderId, message: data});
	  msg.remove();
}

function connect(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    if (sender != yourId) {
        if (msg.ice != undefined){
            peerConnection.addIceCandidate(new RTCIceCandidate(msg.ice));}
        else if (msg.sdp.type == "offer")
            {peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => peerConnection.createAnswer())
              .then(answer => peerConnection.setLocalDescription(answer))
              .then(() => sendMessage(yourId, JSON.stringify({'sdp': peerConnection.localDescription})));}
        else if (msg.sdp.type == "answer"){
            peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));}
          }
}

database.on('child_added', connect);

async function start() {
  navigator.mediaDevices.getUserMedia({audio:true, video:true})
    .then(stream => localVideo.srcObject = stream)
    .then(stream => peerConnection.addStream(stream));
  startButton.disabled = true;
	hangupButton.disabled = false;
}

function showFriendsFace() {
 peerConnection.createOffer()
   .then(offer => peerConnection.setLocalDescription(offer))
   .then(() => sendMessage(yourId, JSON.stringify({'sdp': peerConnection.localDescription})));
}

function textMessage(senderId, text) {
  textArea.disabled = false;
  var text = document.getElementById('inbox').value;
  var senttext = database.push({ sender: yourId, message: text});
}

var ref = firebase.database().ref();
ref.on("value", receiveText);


function receiveText(text){
  //console.log(text.val());
  var message =JSON.parse(JSON.stringify(text.val()));

  var index = [];
  for (var x in message) {
   index.push(x);
 }
 var msgs =  message[index[index.length-1]].message;
 var sentBY = message[index[index.length-1]].sender;

  if(sentBY != yourId && msgs.includes("sdp") == false && msgs.includes("ice") == false)
  {
      textArea1.value = msgs;
  }
  ref.remove();
}
