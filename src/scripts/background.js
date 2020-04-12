/**
 *   background.js
 * 
 *   hosts the logic in the background mediating between the popup and page script.
 *   
 */
let currentEvent = -1
let state = 'inactive'
let currentSite = ''
let currentTab = -1
let data = {events:[], finalSite:'', runFinished:false}
let siteChanged = true
chrome.runtime.onMessage.addListener(function(request, sender, respond){
//	console.log("request received:")
//	console.log(request)
	switch(request.type) {
		case "checkin":
			if(state === "record"){
				recordPage(request, respond, sender.tab.id)
			}else if(state === "run"){
				run(request,respond)
			}else{
				respond({type:"inactive"})
			}
			updateCurrentTab(sender.tab.id)
			break
		case "getState":
			respond({state:state, data:data})
			break
		case "start":
			startRecording()
			break
		case "stop":
			stopRecording()
			break
		case "startRunning":
			startRunning(request)
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
//	console.log("data:")
//	console.log(data)
})

function updateCurrentTab(tabId){
	if(currentTab!=-1 && tabId !== currentTab ){
		chrome.tabs.sendMessage(currentTab, { type:"stop" }); //ask page to stop listening
	}
	currentTab = tabId
}

function startRunning(request){
	currentEvent = 0
	data = request.data
	state = "run"
	chrome.tabs.create({url: data.events[0].site})
	console.log("start command sent")
}
function run(request,respond){
	if(currentEvent == data.events.length){
		state = "inactive"
		data.runFinished = true
		chrome.windows.create({	url: 'html/report.html', type: 'popup', width: 700, height: 800});
		respond({finished: true})
		return
	}
	data.events[currentEvent].visited = (data.events[currentEvent].site != null && request.site == data.events[currentEvent].site)
	nextPageEvent = currentEvent+1
	while(nextPageEvent < data.events.length && !data.events[nextPageEvent].site){
		nextPageEvent++
	}
	respond({ run: true, events: data.events.slice(currentEvent, nextPageEvent) });
	currentEvent = nextPageEvent
	
	console.log("record command sent")
}

function saveEvent(event){
	console.log('event to save : '+event.type)
	if (siteChanged) {
		event.site = currentSite
		siteChanged = false;
	}
	data.events.push(event)
}
function saveClick(request) {
	saveEvent(request);
}

function saveKey(request) {
	if (data.events.length == 0 || data.events[data.events.length - 1].type !== "text") {
		saveEvent({ type: "text", value: request.key });
	}else {
		data.events[data.events.length - 1].value += request.key;
	}
}

function recordPage(request, respond) {
	console.log("page recording: "+currentSite)
	currentSite = request.site;
	siteChanged = true;
	console.log("page registered"+currentSite)
	respond({ record: true });
}

function stopRecording() {
	data.finalSite = currentSite
	chrome.tabs.sendMessage(currentTab, { type:"stop" });
	chrome.browserAction.setIcon({ path: "assets/play.png" });
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { type:"stop" }); //ask page to stop listening
	});
	state = 'inactive';
	console.log("sending data upon stop request")
	console.log(data)
}

function startRecording() {
	chrome.browserAction.setIcon({ path: "assets/record.png" });
	//chrome.windows.create({	url: 'html/report.html', type: 'popup', width: 600, height: 800});
	
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		console.log(tabs);
		chrome.tabs.sendMessage(tabs[0].id, { type:"record" }, function (response) {
			currentSite = response;
			console.log("response from page.start:"+response)
			data.events = []
			siteChanged = true
			state = 'record'
		});
	});
}
