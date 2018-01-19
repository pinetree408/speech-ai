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
	    player.setVolume($("#volumeRange").val());
	    progressTimer = setInterval(function(){
              var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	      $("#myRange").val(unit);
	    }, progressTimerInterval);
            $("#music-controller-title").text(msg.song.title);
	    $("#music-controller-play > i").attr("class", 'fa fa-pause');
	    $("#music-controller-stop > i").attr("class", 'fa fa-stop-circle');
            response = 'okay, i will play the song.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.stop':
          if (player != undefined) {
	    clearInterval(progressTimer);
	    $("#myRang").val(0);
            player.stopVideo();
	    $("#music-controller-stop > i").attr("class", 'fa fa-stop-circle-o');
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
	    $("#music-controller-play > i").attr("class", 'fa fa-pause');
	    $("#music-controller-stop > i").attr("class", 'fa fa-stop-circle');
            response = 'okay, i will play.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.pause':
          if (player != undefined) {
	    clearInterval(progressTimer);
            player.pauseVideo();
	    $("#music-controller-play > i").attr("class", 'fa fa-play');
            response = 'okay, i will pause.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.mute':
          if (player != undefined) {
            player.mute();
	    $("#music-controller-mute > i").attr('class', 'fa fa-volume-off');
            response = 'okay, i will mute.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.unmute':
          if (player != undefined) {
            player.unMute();
            $("#music-controller-mute > i").attr('class', 'fa fa-volume-up');
            response = 'okay, i will unmute.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.volumeup':
          if (player != undefined) {
            $("#volumeRange").val(player.getVolume() + 10);
            player.setVolume(player.getVolume() + 10);
            response = 'okay, i will increase volume.';
          } else {
            response = 'The player has not been set.'
          }
          break;
        case 'music_player_control.volumedown':
          if (player != undefined) {
            $("#volumeRange").val(player.getVolume() - 10);
            player.setVolume(player.getVolume() - 10);
            response = 'okay, i will decrease volume.';
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
      $("#volumeRange").val(player.getVolume());
      $("#music-controller-mute > i").attr('class', 'fa fa-volume-up');
    } else {
      player.mute();
      $("#volumeRange").val(0);
      $("#music-controller-mute > i").attr('class', 'fa fa-volume-off');
    }
  });

  $("#music-controller-play").click(function() {
    switch (player.getPlayerState()) {
      case 0:
      case 5:
        // stop (ended, cued)
        player.playVideo();
	progressTimer = setInterval(function(){
          var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	  $("#myRange").val(unit);
	}, progressTimerInterval);
	$("#music-controller-play > i").attr("class", 'fa fa-pause');
	$("#music-controller-stop > i").attr("class", 'fa fa-stop-circle');
	break;
      case 1:
        // play
	clearInterval(progressTimer);
	player.pauseVideo();
	$("#music-controller-play > i").attr("class", 'fa fa-play');
        break;
      case 2:
        // pause
	player.playVideo();
	progressTimer = setInterval(function(){
          var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	  $("#myRange").val(unit);
	}, progressTimerInterval);
	$("#music-controller-play > i").attr("class", 'fa fa-pause');
	break;
    }
  });

  $("#music-controller-stop").click(function() {
    switch (player.getPlayerState()) {
      case 0:
      case 5:
        // stop (ended, cued)
        player.playVideo();
	progressTimer = setInterval(function(){
          var unit  = (player.getCurrentTime() / player.getDuration()) * 100;
	  $("#myRange").val(unit);
	}, progressTimerInterval);
	$("#music-controller-play > i").attr("class", 'fa fa-pause');
	$("#music-controller-stop > i").attr("class", 'fa fa-stop-circle');
	break;
      case 1:
        // play
	clearInterval(progressTimer);
	player.stopVideo();
	$("#music-controller-play > i").attr("class", 'fa fa-play');
	$("#music-controller-stop > i").attr("class", 'fa fa-stop-circle-o');
        break;
      case 2:
        // pause
	player.stopVideo();
	$("#music-controller-play > i").attr("class", 'fa fa-play');
	$("#music-controller-stop > i").attr("class", 'fa fa-stop-circle-o');
	break;
    }
  });

  $("#volumeRange").on("input", function(e) {
    player.setVolume($("#volumeRange").val());
  });
});
