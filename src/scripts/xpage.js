chrome.runtime.onMessage.addListener( (request, _, respond) => {
	if(request.type==="record"){
		reloadEventListeners()
		respond(window.location.href)
	}else if(request.type==="stop"){
		removeEventListeners()
	}
})
let cover = document.createElement('div')
cover.style = "opacity:0.8;position:fixed;width:100%;height:100%;top:0px;left:0px;z-index:1111;background-color:#cccccc75;"
let recordingSpan = document.createElement('span')
recordingSpan.innerHTML = "recording"
recordingSpan.style="color:red;font-size:20;float:right;"

if(localStorage.getItem('captureData')){
	chrome.runtime.sendMessage({type:"startRunning", data:JSON.parse(localStorage.getItem('captureData'))})
}else{
	chrome.runtime.sendMessage({type:"checkin", site:window.location.href}, function(response){
		if(response.run){
			executeEvent(response.events, 0)
		}else if(response.record){
			reloadEventListeners()
		}
	})
}

let lastElement = undefined
let waitCount = 0
let waiting = false
function executeEvent(events, index){
	if(index >= events.length){
		return
	}
	let event = events[index]

	if(event.type==="click"){
		if(event.waitFor && event.site !== window.location.href){
			setTimeout(()=> { executeEvent(events, index)}, 500)
			return
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
	if(event.value === "Enter"){
		
		if (lastElement) {
			console.log('dispatching on lastElement')
			lastElement.closest('form').submit()
		}
		else if (document.activeElement) {
			console.log('dispatching on activeElement')
			document.activeElement.closest('form').submit()
		}	
	}else{
		if (lastElement) {
			lastElement.value = event.value
		}
		else if (document.activeElement) {
			if (document.activeElement.value != null) {
				document.activeElement.value += event.value
			}
			else {
				document.activeElement.value = event.value
			}
		}	
	}
}

function generateClick(event) {
	lastElement = document.elementFromPoint(event.element.position.x, event.element.position.y)
	if (lastElement.childElementCount > 0) { //ugly fix
		lastElement.children[0].click()
	}
	else {
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
	cover.addEventListener("click", sendClick)
	removeEventListeners()
	addEventListeners()
}
function removeEventListeners(){
	document.body.removeEventListener('keypress', sendKey)
	if(document.body.contains(cover))document.body.removeChild(cover)
}
function addEventListeners(){
	document.body.addEventListener('keypress', sendKey)
	document.body.appendChild(cover)
	cover.appendChild(recordingSpan)
}