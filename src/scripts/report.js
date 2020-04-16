let data = {}
const getById = (id) => document.getElementById(id)

document.addEventListener('DOMContentLoaded', ()=>{

    getById("upload").addEventListener('change', uploadJSON)
	getById("run").addEventListener('click', ()=>{
        chrome.runtime.sendMessage({type:"startRunning", data:data})
    })
	getById("download").addEventListener('click', ()=> getById('export').click())
    checkinPage()
})

function checkinPage() {

    try {
        chrome.runtime.sendMessage({ type: "getState" }, function (response) {
            if (response.state == "record") {
                toggleButtons(false)
            }else if (response.data.events.length > 0) {
                data = response.data
                setContent()
            }
        })
    }
    catch (error) {
        console.log(error)
    }
}

function getRow(event, runFinished){

    let eventName = event.type
    if(event.type==="text"){
        if(event.value === "Enter"){
            eventName = "Press Enter"
        }else{
            eventName = "enter text:" + event.value
        }
    } 
    let element = event.type==="scroll" ? "window" : JSON.stringify(event.element)
    let className = runFinished && event.site ? (event.visited ? "green-row":"red-row"):""
    let visitedCol = (runFinished? (event.visited? "<td>yes</td>":"<td>no</td>"):"")
    let reloadedCol = (event.reloaded? "yes":"no")

    return `<tr class="${className}">
                <td class="eventSite">${event.site?event.site:""}</td>
                <td>${eventName}</td>
                <td>${element}</td>
                <td>${reloadedCol}</td>
                ${visitedCol}
            </tr>`
}

function toggleButtons (start) {

    getById("cbuttons").style.display = start? "block":"none"
    getById("pcontent").style.display = start? "block":"none"
}

function setContent() {

    toggleButtons(true)
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var dlAnchorElem = getById('export');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "result.json");
	runFinished = (data.finalSiteVisited !== null)
    if(runFinished){
        document.getElementsByClassName("visited")[0].style.display = "table-cell"
    }    getById("contentbody").innerHTML = data.events.map(event=> getRow(event, runFinished)).join('')
    
    let link = getById("sitelink").children[0]
    link.innerHTML = data.finalSite
    link.setAttribute('href', data.finalSite)
    getById("sitelink").style.display = "block" 
}

function uploadJSON() {

	var file = getById('upload').files[0]    
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            data = JSON.parse(e.target.result)
            setContent()
        };
      })(file);
      reader.readAsText(file);
}