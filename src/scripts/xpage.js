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
cover.style = "opacity:0.8;position:fixed;width:100%;height:100%;top:0px;left:0px;z-index:1111;background-color:#cccccc75;"
let recordingSpan = document.createElement('span')
recordingSpan.innerHTML = "recording"
recordingSpan.style="color:red;font-size:20;float:right;"
chrome.runtime.sendMessage({type:"checkin", site:window.location.href}, function(response){
	if(response.run){
		console.log('it says run')
		console.log(response)
		executeEvent(response.events, 0)
	}else if(response.record){
		reloadEventListeners()
	}else if(response.finished){
		console.log("run finished")
	}
})


cover.addEventListener("click", function(event){
	event.preventDefault()
	event.stopPropagation()
	document.body.removeChild(cover)

	chrome.runtime.sendMessage({type: "click",x:event.pageX, y:event.pageY})
	console.log(document.elementFromPoint(event.clientX, event.clientY))
	let element = document.elementFromPoint(event.clientX, event.clientY)
	while(!element.click){
		element = element.parentElement
	}
	element.click()
	element.focus()
	setTimeout(()=>{
		document.body.appendChild(cover)
	}, 200)
	return false
})
let lastElement = undefined
function executeEvent(events, index){
	if(index >= events.length){
		return
	}
	let event = events[index]
	console.log("event to run:")
	console.log(event)
	if(event.type==="click"){
		console.log("gonna click "+event.x + ":"+event.y)
		lastElement = document.elementFromPoint(event.x, event.y)
		console.log(lastElement)
		document.elementFromPoint(event.x, event.y).click()

	}else if(event.type==="text"){
		console.log("gonna enter text")
		if(lastElement){
			console.log("appending to lastElement:"+event.value)
			lastElement.value = event.value
		}else if(document.activeElement){
			if(document.activeElement.value != null){
				console.log("appending:"+event.value)
				document.activeElement.value += event.value
			}else{
				console.log("setting:"+event.value)
				document.activeElement.value = event.value
			}
		}else {
			console.log("could not set:"+event.value)
		}
	}
	setTimeout(()=> {
		executeEvent(events, index+1)
	}, 500)
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
