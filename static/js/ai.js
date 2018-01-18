var socket;
var progressTimer;
var progressTimerInterval = 500;
$(document).ready(function(){
  socket = io.connect("http://" + document.domain + ":" + location.port + "/mynamespace");
  const outputYou = $('#output-you');
  const outputBot = $('#output-bot');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  socket.on('response', function(msg) {
    if (msg.data == 'Requested') {
      var response = '';
      switch (msg.action) {
        case 'music.play' :
          if (player != undefined) {
            player.loadVideoById(msg.song.id);
	    progressTimer = setInterval(function(){
              var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	      $("#myRange").val(unit);
	    }, progressTimerInterval);
            $("#music-controller-title").text(msg.song.title);
            response = 'okay, i will play ' + msg.song.title + '.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.stop':
          if (player != undefined) {
	    clearInterval(progressTimer);
	    $("#myRang").val(0);
            player.stopVideo();
	    $("music-controller-play").text("stop");
            response = 'okay, i will stop.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.play':
          if (player != undefined) {
            player.playVideo();
	    progressTimer = setInterval(function(){
              var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	      $("#myRange").val(unit);
	    }, progressTimerInterval);
	    $("music-controller-play").text("play");
            response = 'okay, i will play.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.pause':
          if (player != undefined) {
	    clearInterval(progressTimer);
            player.pauseVideo();
	    $("music-controller-pause").text("pause");
            response = 'okay, i will pause.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.mute':
          if (player != undefined) {
            player.mute();
	    $("music-controller-mute").text("mute");
            response = 'okay, i will mute.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.unmute':
          if (player != undefined) {
            player.unMute();
	    $("music-controller-mute").text("unmute");
            response = 'okay, i will unmute.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        default :
          response = "i can't do it.";  
          break;   
      }
      synthVoice(response);
      outputBot.text(response);
    } else if (msg.data == 'Connected') {
      console.log("Socket connected");
    }
  });

  $('#recognition-start').click(function() {
    player.mute();
    recognition.start();
  });

  recognition.addEventListener('speechstart', () => {
    console.log('Speech has been detected.');
  });

  recognition.addEventListener('result', (e) => {
    console.log('Result has been detected.');

    let last = e.results.length - 1;
    let text = e.results[last][0].transcript;

    outputYou.text(text);
    console.log('Confidence: ' + e.results[0][0].confidence);
  
    socket.emit("request", {data: text});
  });

  recognition.addEventListener('speechend', () => {
    recognition.stop();
    player.unMute();
  });

  recognition.addEventListener('error', (e) => {
    outputBot.textContent = 'Error: ' + e.error;
  });

  function synthVoice(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = 'en-US';
    utterance.text = text;
    synth.speak(utterance);
  }

  $("#music-controller-mute").click(function() {
    if (player.isMuted()) {
      player.unMute();
      $("#music-controller-mute").text("unmute");
    } else {
      player.mute();
      $("#music-controller-mute").text("mute")
    }
  });

  $("#music-controller-play").click(function() {
    switch (player.getPlayerState()) {
      case 0:
        // stop
        player.playVideo();
	progressTimer = setInterval(function(){
          var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	  $("#myRange").val(unit);
	}, progressTimerInterval);
        $("#music-controller-play").text("play");
	break;
      case 1:
        // play
	clearInterval(progressTimer);
	player.pauseVideo();
	$("#music-controller-play").text("pause");
        break;
      case 2:
        // pause
	player.playVideo();
	progressTimer = setInterval(function(){
          var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	  $("#myRange").val(unit);
	}, progressTimerInterval);
	$("#music-controller-play").text("play");
	break;
    }
  });
});
