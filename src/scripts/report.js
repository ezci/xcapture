let data = {}
document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById("upload").addEventListener('change', uploadJSON)
	document.getElementById("run").addEventListener('click', run)
	document.getElementById("download").addEventListener('click', ()=> document.getElementById('export').click())

    chrome.runtime.sendMessage({type:"getState"},function(response){
        console.log("first response in report")
        console.log(response)
        if(response.state == "record"){
            toggleButtons(false)
        }else if(response.data.events.length >0){
            data = response.data
            setContent()
        }
    })
})

function getRow(event, runFinished){
    let value = event.type==="click"?`"x:${event.x} y:${event.y} "` : event.value.replace(/Enter/g, "[ENTER]")
    let className = runFinished ? (event.visited ? "green-row":"red-row"):""
    let visitedCol = (runFinished? (event.visited? "<td>yes</td>":"<td>no</td>"):"")
    return `<tr class="${className}"><td>${event.type}</td><td>${value}</td><td>${event.site?event.site:""}</td>${visitedCol}</tr>`
}

function toggleButtons (start) {
    document.getElementById("cbuttons").style.display = start? "block":"none"
    document.getElementById("pcontent").style.display = start? "block":"none"
}

function run()  {
    chrome.runtime.sendMessage({type:"startRunning", data:data})
}

function setContent() {
    toggleButtons(true)
    if(data.runFinished){
        document.getElementsByClassName("visited")[0].style.display = "table-cell"
    }
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var dlAnchorElem = document.getElementById('export');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "result.json");
    dlAnchorElem.style.display = "inline-block"
	
    document.getElementById("contentbody").innerHTML = data.events.map(event=> getRow(event, data.runFinished)).join('')
    
    let link = document.getElementById("sitelink").children[0]
    link.innerHTML = data.finalSite
    link.setAttribute('href', data.finalSite)
    document.getElementById("sitelink").style.display = "block" 
}

function uploadJSON() {
    console.log('running uploadjson')

	var file = document.getElementById('upload').files[0]    
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            data = JSON.parse(e.target.result)
            setContent()
        };
      })(file);
      reader.readAsText(file);
}