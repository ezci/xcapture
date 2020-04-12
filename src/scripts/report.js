let events = []
let site = ""
document.addEventListener('DOMContentLoaded', ()=>{
    chrome.runtime.sendMessage({type:"getState"},function(response){
        console.log("first response in report")
        console.log(response)
        if(response.state == "record"){
            toggleButtons(false)
        }else if(response.events.length>0){
            events = response.events
            site = response.site
            setContent()
        }
    })

	document.getElementById("upload").addEventListener('change', uploadJSON)
	document.getElementById("run").addEventListener('click', run)
	document.getElementById("download").addEventListener('click', ()=> document.getElementById('export').click())
})

function getRow(event){
    let value = event.type==="click"?`"x:${event.x} y:${event.y} "` : event.value.replace(/Enter/g, "[ENTER]")
    return `<tr><td>${event.type}</td><td>${value}</td><td>${event.site?event.site:""}</td></tr>`
}

function toggleButtons (start) {
    document.getElementById("cbuttons").style.display = start? "block":"none"
    document.getElementById("pcontent").style.display = start? "block":"none"
}

function run()  {
    chrome.runtime.sendMessage({type:"run", events:events}, function(response){
        console.log("must have started running:")
        console.log(response)
    })
}

function setContent() {
    toggleButtons(true)
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events));
    var dlAnchorElem = document.getElementById('export');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "result.json");
    dlAnchorElem.style.display = "inline-block"
	let content = events.map(event=> getRow(event)).join('')
    document.getElementById("contentbody").innerHTML = content	
    
    let link = document.getElementById("sitelink").children[0]
    link.innerHTML = site
    link.setAttribute('href', site)
}

function uploadJSON() {
    console.log('running uploadjson')

	var file = document.getElementById('upload').files[0]    
	console.log(file)
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            content = JSON.parse(e.target.result)
            events = content.events
            site = content.site
            setContent()
        };
      })(file);
      reader.readAsText(file);
}