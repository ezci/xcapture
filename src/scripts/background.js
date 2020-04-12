/**
 *   background.js
 * 
 *   hosts the logic in the background mediating between the popup and page script.
 *   
 */
let events = []
let currentEvent = -1
let state = 'inactive'
let currentSite = ''
siteChanged = true

chrome.runtime.onMessage.addListener(function(request, sender, respond){
	console.log("request received:")
	console.log(request)
	switch(request.type) {
		case "checkin":
			if(state === "record"){
				recordPage(request, respond)
			}else if(state === "run"){
				run(respond)

			}else{
				respond({type:"inactive"})
			}
			break
		case "getState":
			respond({state:state, events:events, site:currentSite})
			break
		case "start":
			startRecording(respond)
			break
		case "stop":
			stopRecording(respond)
			break
		case "startRunning":
			startRunning(respond)
			break
		case "key":
			saveKey(request)
			break
		case "click":
			saveClick(request)
			break
		default:
			console.error("unknown request")
			console.error(request)
	}
	console.log("events:")
	console.log(events)
})

function startRunning(request, respond){
	currentEvent = 0
	chrome.tabs.create({url: request.events[0].site})
	respond({ started: true });
	console.log("record command sent")
}
function run(respond){
	respond({ record: true, events: events.slice(currentEvent) });
	console.log("record command sent")
}

function saveEvent(event){
	if(events.length ==0){
		event.site = currentSite
	}
	events.push(event)
}
function saveClick(request) {
	if (siteChanged) {
		request.site = currentSite;
		siteChanged = false;
	}
	saveEvent(request);
}

function saveKey(request) {
	if (events.length == 0 || events[events.length - 1].type !== "text") {
		saveEvent({ type: "text", value: request.key });
	}else {
		events[events.length - 1].value += request.key;
	}
}

function recordPage(request, respond) {
	console.log("page recording: "+currentSite)
	currentSite = request.site;
	siteChanged = true;
	console.log("page registered"+currentSite)
	respond({ record: true });
}

function stopRecording(respond) {
	if (siteChanged && events.length >0) {
		events[events.length-1].site = currentSite
	}
	chrome.browserAction.setIcon({ path: "assets/play.png" });
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { start: false }); //ask page to stop listening
	});
	state = 'inactive';
	console.log("sending data upon stop request")
	console.log(events)
	respond({ events: events, site: currentSite });
}

function startRecording(respond) {
	chrome.browserAction.setIcon({ path: "assets/record.png" });
	//chrome.windows.create({	url: 'html/report.html', type: 'popup', width: 600, height: 800});
	
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		console.log(tabs);
		chrome.tabs.sendMessage(tabs[0].id, { record: true }, function (response) {
			site = response;
			console.log("response from page.start:"+response)
			events = []
			siteChanged = true
			state = 'record'
			//console.log("started set to true")
			respond({ data: events, site: currentSite });
		
		});
	});
}
