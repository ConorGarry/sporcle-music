console.log("Hello from Sporcle music.js");

let mediaSource;
let player;
let scWidget;

// YouTube API (currently not used)- 
window.onYouTubeIframeAPIReady = function() {
  console.log("onYouTubeIframeAPIReady");
  player = new YT.Player('embedMedia', {
    events: {
      // 'onReady': onPlayerReady,
      // 'onStateChange': onPlayerStateChange
    }
  });
}

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const iframeMedia = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="soundcloud.com"]');
console.log(`iframeMedia: ${iframeMedia[0].src}`);
if (iframeMedia[0].src.includes("youtube")) {
  iframeMedia[0].id = "youtube-widget";
}
else if (iframeMedia[0].src.includes("soundcloud")) {
  iframeMedia[0].id = "soundcloud-widget";
}

// Run local script ./soundcloud-api.js
const script = document.createElement("script");
script.src = browser.runtime.getURL("./soundcloud-api.js");
(document.head || document.body || document.documentElement).appendChild(script);
script.onload = function() {
  console.log("soundcloud-api.js loaded");
  const scType = typeof SC;
  console.log("scType: " + scType);
  scWidget = SC.Widget("soundcloud-widget");
  console.log("scWidget: " + scWidget);
  // scWidget.play();
}


// Get element Table by id gameTable and fetch all the
// content of the td of eaxch row with the id `name0`.
function parseTableTimeCodes() {
  const original = {
    color: "black",
    textDecoration: "none",
  };
  const hover = {
    color: "white",
    textDecoration: "underline",
  };

  const mouseOver = function() {
    Object.assign(this.style, hover);
  };

  const mouseOut = function() {
    Object.assign(this.style, original);
  };

  // Extract table rows without the headers.
  const table = document.getElementById("gameTable");
  if (!table) {
    return;
  }
  const columns = Array.from(table.querySelectorAll(".gametable-col"));
  const rows = columns.map(col => Array.from(col.getElementsByTagName("tr"))).flat();
  const dataRows = rows.filter(
    row => row.cells[0].tagName !== "TH"
  );

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const timeCodeElement = row.querySelector(`#name${i}`);
    timeCodeElement.style.cursor = "pointer";

    // Add a hover listener to the timeCodeElement.
    timeCodeElement.addEventListener("mouseover", mouseOver);
    timeCodeElement.addEventListener("mouseout", mouseOut);

    mediaSource = getMediaSource();
    timeCodeElement.addEventListener("click", function() {
      const timeCode = timeCodeElement.textContent.split("-")[0];
      goToTimeCode(timeCode);
    });
  }
}

function getMediaSource() {
  const iframe = iframeMedia[0];
  // if not already, add enablejsapi=1 to the src of the iframe.
  if (!iframe.src.includes("enablejsapi=1")) {
    iframe.src = iframe.src + "?enablejsapi=1";
  }
  return iframe.src;
}


// In the page there will be a div with id `embedMedia` that will contain either a YouTube
// video or SoundCloud audio. This function will go to the timecode of the media:
function goToTimeCode(timeCode) {
  const src = iframeMedia[0].src;
  const tcSeconds = timecodeToSeconds(timeCode) - 1;
  if (isNaN(tcSeconds)) {
    return;
  }

  const iframe = iframeMedia[0];
  if (src.includes("youtube")) {
    goToYouTubeTimeCode(iframe, tcSeconds);
  }
  else if (src.includes("soundcloud")) {
    goToSoundCloudTimeCode(iframe, tcSeconds);
  }
}

function goToYouTubeTimeCode(iframe, tcSeconds) {
  console.log(`timeCode: ${tcSeconds}`);
  const embedMedia = document.getElementById("embedMedia");

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: "seekTo",
      args: [tcSeconds, true]
    }),
    "*"
  );

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: "pauseVideo",
      args: []
    }),
    "*"
  );

  setTimeout(function() {
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "playVideo",
        args: []
      }),
      "*"
    );
  }, 300);
}

function goToSoundCloudTimeCode(iframe, timeCode) {
  console.log(`SoundCloud timeCode:: ${timeCode}`);
  // browser.runtime.sendMessage("test");
  browser.runtime.onMessage.addListener((message) => {
    if (message.response) {
      console.log("Response received in content script:", message.response);
    }
  });

  scWidget.seekTo(timeCode * 1000);
}

function timecodeToSeconds(timecode) {
  const parts = timecode.split(':');
  if (parts.length < 2) {
    return 0;
  }
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parseInt(parts[0]) * 3600;
    parts.shift(); // Remove hours part
  }
  seconds += parseInt(parts[0]) * 60;
  seconds += parseInt(parts[1]);
  return seconds;
}

parseTableTimeCodes(); 

// TODO
// parse different formats of timecodes.
// Get original text color instead of assuming black/white, or just use opacity?
// YT use same pattern as Soundcloud or just use postMessage?
