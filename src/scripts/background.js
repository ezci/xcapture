/**
 *   background.js
 * 
 *   hosts the logic in the background mediating between the popup and page script.
 *   
 */
let currentEvent = -1
let state
let currentSite 
let currentTab
let reloaded
let data = initData('inactive', -1)

chrome.runtime.onMessage.addListener(function(request, sender, respond){

	if(sender.url.endsWith('popup.html')){
		processPopupRequest(request, respond)
	}else{
		processPageRequest(request, respond, sender)
	}
})

function processPageRequest(request, respond, sender) {
	
	switch (request.type) {
		case "checkin":
			checkinPage(request, respond, sender)
			break
		case "reportExecutions":
			reportExecutions(request)
		case "getState":
			respond({ state: state, data: data })
			break
		case "startRunning":
			startRunning(request)
			break
		case "text":
			saveKey(request)
			break
		case "click":
			saveClick(request)
			break
		default:
			console.error("unknown request from page")
			console.error(request)
	}
}

function checkinPage(request, respond, sender){

	if (state === "record") {
		registerPage(request, respond, sender.tab.id)
	}
	else if (state === "run") {
		sendEventsToRun(request, respond)
	}
	else {
		respond({ type: "inactive" })
	}
	updateCurrentTab(sender.tab.id)
}

function processPopupRequest(request, respond){

	switch(request.type) {
		case "getState":
			respond({state:state, data:data})
			break
		case "start":
			startRecording()
			break
		case "stop":
			stopRecording()
			break
		default:
			console.error("unknown request from popup")
			console.error(request)
	}
}

function reportExecutions(request){

	console.log("reporting: ")
	console.log(request)
	for(var i=request.visiteds.length;i>0;i--){
		data.events[currentEvent-i].visited = request.visiteds[i-1]
	}
	console.log("reported count: "+request.visiteds.length)
}

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
}

function sendEventsToRun(request, respond){

	if(currentEvent == data.events.length){
		console.log("end of execution")
		state = "inactive"
		data.finalSiteVisited = request.site
		chrome.windows.create({	url: 'html/report.html', type: 'popup', width: 700, height: 800});
		respond({finished: true})
		return
	}
	nextPageEvent = currentEvent+1
	while(nextPageEvent < data.events.length && !data.events[nextPageEvent].reloaded){
		nextPageEvent++
	}
	console.log("gonna send:"+currentEvent + ":"+nextPageEvent)
	respond({ run: true, events: data.events.slice(currentEvent, nextPageEvent) });
	currentEvent = nextPageEvent
	
}

function saveEvent(event){

	event.site = currentSite
	if (reloaded) {
		event.reloaded = true
		reloaded = false;
	}
	data.events.push(event)
}

function saveClick(request) {

	let waitFor = false
	if(request.site !== currentSite && !reloaded){ //ajax
		waitFor = true
		currentSite = request.site
	}
	if(request.scrollX > 0 || request.scrollY > 0){
		saveEvent({type:'scroll', x:request.scrollX, y:request.scrollY, waitFor:waitFor})
		saveEvent(request);
	}else{
		request.waitFor = waitFor
		saveEvent(request);
	}
}

function saveKey(request) {

	if (isAppending(request.value)) {
		data.events[data.events.length - 1].value += request.value;
	}else {
		saveEvent(request);
	}
}

function isAppending(newKey){
	return data.events.length > 0 
	&& data.events[data.events.length - 1].type === "text" 
	&& newKey !== "Enter" 
	&& data.events[data.events.length - 1] !== "Enter"
}

function registerPage(request, respond) {

	currentSite = request.site;
	reloaded = true;
	respond({ record: true });
}

function stopRecording() {

	data.finalSite = currentSite
	chrome.tabs.sendMessage(currentTab, { type:"stop" });
	chrome.browserAction.setIcon({ path: "assets/play.png" });
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { type:"stop" }); //ask page to stop listening
	});
	state = "inactive";
}

function startRecording() {

	chrome.browserAction.setIcon({ path: "assets/record.png" });	
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { type:"record" }, function (response) {
			currentSite = response;
			console.log("response from page.start:"+response)
			data = initData('record', tabs[0].id)
		});
	});
}

function initData(_state, _currenTab){

	state = _state
	reloaded = true
	currentTab = _currenTab
	return {events:[], finalSite:'', finalSiteVisited:null}
}