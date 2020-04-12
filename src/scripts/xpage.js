chrome.runtime.onMessage.addListener( (request, _, respond) => {
	if(request.type==="record"){
		reloadEventListeners()
		respond(window.location.href)
	}else if(request.type==="stop"){
		removeEventListeners()
	}
	console.log("request:")
	console.log(request)
})

let cover = document.createElement('div')
cover.style = "opacity:0.8;position:fixed;width:100%;height:100%;top:0px;left:0px;z-index:1000;background-color:#cccccc75;"
let recordingSpan = document.createElement('span')
recordingSpan.innerHTML = "recording"
recordingSpan.style="color:red;font-size:20;float:right;"

cover.addEventListener("click", function(event){
	document.body.removeChild(cover)
	chrome.runtime.sendMessage({type: "click",x:event.clientX, y:event.clientY})
	document.elementFromPoint(event.clientX, event.clientY).click()
	document.elementFromPoint(event.clientX, event.clientY).focus()
	setTimeout(()=>{
        console.log(event.clientX + " "+event.clientY)
		document.body.appendChild(cover)
    }, 200)
})


chrome.runtime.sendMessage({type:"checkin", site:window.location.href}, function(response){
	if(response.run){
		run(response.events)
	}else if(response.record){
		reloadEventListeners()
	}
})

function run(events){
	let index = 0
	setTimeout(()=>{
		executeEvent(event)
		run(events, index+1)
		}, 2000)
}

function executeEvent(event){
	if(event.type==="click"){
		document.elementFromPoint(events[index].x, events[index].y).click()
	}else if(event.type==="key"){
		var evt = document.createEvent('HTMLEvents');
		evt.view = window;
		evt.altKey = false;
		evt.ctrlKey = false;
		evt.shiftKey = false;
		evt.metaKey = false;
		evt.keyCode = 65;
		//evt.charCode = 'a';
        evt.initEvent("key", false, true);
        document.dispatchEvent(e);

	}
}

function sendKey(event){
	chrome.runtime.sendMessage({type: "key", key:event.key})
	console.log('sent key')
}

function reloadEventListeners(){
	removeEventListeners()
	addEventListeners()
}
function removeEventListeners(){
	console.log("removing listeners")
	document.body.removeEventListener('keypress', sendKey)
	if(document.body.contains(cover))document.body.removeChild(cover)
}
function addEventListeners(){
	document.body.addEventListener('keypress', sendKey)
	document.body.appendChild(cover)
	cover.appendChild(recordingSpan)
	//recordingSpan.appendChild(stopButton)


	console.log('xcapture event listeners added')
}
