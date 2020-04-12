chrome.runtime.onMessage.addListener( (request, _, respond) => {
	if(request.record){
		reloadEventListeners()
		respond(window.location.href)
	}else{
		removeEventListeners()
	}
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
let stopped = false
function sendAClick(event){
	console.log('captured : '+event.target.tagName)	
	if(stopped){
		console.log('already stopped')
		stopped = false
		return true
	}
	stopped = true
	event.preventDefault()
	event.stopPropagation()
	chrome.runtime.sendMessage({type: "click",x:event.clientX, y:event.clientY})
	console.log('sent A click')
	console.log(event)
	setTimeout(()=>(event.target.click ?event.target.click() :document.elementFromPoint(event.clientX, event.clientY).click()), 200)
	return false	
}

function sendClick(event){
	console.log(event.target.tagName)
	chrome.runtime.sendMessage({type: "click",x:event.clientX, y:event.clientY})
	console.log('sent click')
}
function reloadEventListeners(){
	removeEventListeners()
	addEventListeners()
}
function removeEventListeners(){
	document.body.removeEventListener('keypress', sendKey)
	document.body.removeEventListener('click', sendClick)
}
function addEventListeners(){
	document.body.addEventListener('keypress', sendKey)
	document.body.addEventListener('click', sendClick)
	let as = document.querySelectorAll("a")
	
	for(var i=0;i<as.length;i++){
		as[i].addEventListener('click', sendClick)
	}
	
	var observer = new MutationObserver(function(mutationsList) {
		for(var mutation of mutationsList) {
			if (mutation.type == 'childList') {
				console.log("detected change")
				reloadEventListeners()
			}
		}
	})
	observer.observe(document.body, { attributes: true, childList: true })


	console.log('xcapture event listeners added')
}
