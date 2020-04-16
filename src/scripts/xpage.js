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


cover.addEventListener("click", sendClick)



let lastElement = undefined
function executeEvent(events, index){
	if(index >= events.length){
		console.log("asking for send report")
		chrome.runtime.sendMessage({type:"reportExecutions", visiteds:events.map(event=> event.visited)})
		return
	}
	let event = events[index]

	if(event.type==="click"){
		event.visited = window.location.href
		if(event.waitFor && event.site !== window.location.href){
			console.log('gonna wait for:  '+event.site)
			setTimeout(()=> { executeEvent(events, index)}, 500)
			return
		}else{
			console.log("nothing to wait : "+event.waitFor)
			console.log(window.location.href + " vs "+event.site)
		}
	
		generateClick(event)

	}else if(event.type==="text"){
		generateKeyEvent(event)
	}else if(event.type == "scroll"){
		window.scrollTo(event.x, event.y)
	}
	setTimeout(()=> { executeEvent(events, index+1)}, 500)
}

function generateKeyEvent(event) {
	console.log("gonna enter text")
	if (lastElement) {
		console.log("appending to lastElement:" + event.value)
		lastElement.value = event.value
	}
	else if (document.activeElement) {
		if (document.activeElement.value != null) {
			console.log("appending:" + event.value)
			document.activeElement.value += event.value
		}
		else {
			console.log("setting:" + event.value)
			document.activeElement.value = event.value
		}
	}
	else {
		console.log("could not set:" + event.value)
	}
}

function generateClick(event) {
	console.log("gonna click " + event.x + ":" + event.y)
	lastElement = document.elementFromPoint(event.x, event.y)
	console.log(lastElement)
	if (lastElement.childElementCount > 0) { //ugly fix
		console.log('clicking childElement')
		lastElement.children[0].click()
	}
	else {
		console.log('clicking Element')
		lastElement.click()
	}
}

function getElementDescription(element, event){
	return {tag:element.tagName, 
		class:element.className, 
		id:element.id,
		text:element.innerText,
		position:{
			x:event.pageX, 
			y:event.clientY, 
			scrollY:window.scrollY, 
			scrollX:window.scrollX
		}
	}
}

function sendKey(event){
	let message = {type: "text", value:event.key}
	message.element = getElementDescription(event.target, event)
	chrome.runtime.sendMessage(message)
	console.log('sent key')
}

function sendClick(event){
	event.preventDefault()
	event.stopPropagation()
	document.body.removeChild(cover)

	let element = document.elementFromPoint(event.clientX, event.clientY)
	while(!element.click){
		element = element.parentElement
	}

	chrome.runtime.sendMessage({	
		site:window.location.href,
		type: "click", 
		element:getElementDescription(element, event)
	})
	element.click()
	element.focus() //necessary?
		document.body.appendChild(cover)
	return false
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