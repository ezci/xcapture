let data = {}
const getById = (id) => document.getElementById(id)

document.addEventListener('DOMContentLoaded', ()=>{

    getById("upload").addEventListener('change', uploadJSON)
	getById("run").addEventListener('click', ()=>{
        chrome.runtime.sendMessage({type:"startRunning", data:data})
    })
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
        console.error(error)
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
    let element = event.type==="scroll" ? `x:${event.x} y:${event.y}` : JSON.stringify(event.element)
    let reloadedCol = (event.reloaded? "yes":"no")

    return `<tr>
                <td class="eventSite">${event.site?event.site:""}</td>
                <td>${eventName}</td>
                <td>${element}</td>
                <td>${reloadedCol}</td>
            </tr>`
}

function toggleButtons (start) {

    getById("cbuttons").style.display = start? "block":"none"
    getById("pcontent").style.display = start? "block":"none"
}

function setContent() {

    toggleButtons(true)
    setDownloads()
	runFinished = (data.finalSiteVisited !== null)
    if(runFinished){
    }    getById("contentbody").innerHTML = data.events.map(event=> getRow(event, runFinished)).join('')
    
    let link = getById("sitelink").children[0]
    link.innerHTML = data.finalSite
    link.setAttribute('href', data.finalSite)
    getById("sitelink").style.display = "block" 
}


function setDownloads() {
    var jsonData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
    var jsonLink = getById('export')
    jsonLink.setAttribute("href", jsonData)
    jsonLink.setAttribute("download", "captured.json")

    var htmlData = `data:text/html;charset=utf-8,<html><script>localStorage.setItem('captureData','${JSON.stringify(data)}');setTimeout(()=>{window.close()}, 1000);</script></html>`
    var htmlLink = getById('exportHTML')
    htmlLink.setAttribute("href", htmlData)
    htmlLink.setAttribute("download", "captured.html")

    var lastElement = null;
    var robotData = `data:text/plain;charset=utf-8,*** Settings ***
Documentation                                       xCaptured Test
Library                                             SeleniumLibrary
    
*** Variables ***
${data.events.map((event, idx) => '${"link'+idx+'"}    '+event.site).join('\n')}
    
*** Test Cases ***
User can open page 
\tOpen Browser\t${data.events[0].site}\tbrowser=chrome
${data.events.map((event, idx) => {
    if(event.type==='click'){
        lastElement = 'xpath=//' + event.element.path
        return '\tClick Element\t' + lastElement
    }else if(event.type ==='text'){
        return '\tInput Text\t' + lastElement + '\t' + event.value
    }
} ).join('\n')}
`

    var robotLink = getById('exportRobot')
    robotLink.setAttribute("href", robotData)
    robotLink.setAttribute("download", "captured.robot")

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