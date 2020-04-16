const getById = (id) => document.getElementById(id)

document.addEventListener('DOMContentLoaded', initPopupScript)

function toggleButtons(start){

    getById("import").style.display = start? "inline-block":"none"
    getById("start").style.display = start? "inline-block":"none"
    getById("pcontent").style.display = start? "block":"none"
    getById("cbuttons").style.display = start? "block":"none"
    getById("finish").style.display = start? "none":"inline-block"
    getById("state").style.display = start? "none":"inline-block"
}

function initPopupScript(){

    getById("import").addEventListener('click', function(){
        openReport()   
    })
    getById("download").addEventListener('click', function(){
        getById('export').click()
    })
    getById("start").addEventListener("click", function(){
        chrome.runtime.sendMessage({type:"start"})
        toggleButtons(false)    
    })
    getById("finish").addEventListener("click", function(){
        chrome.runtime.sendMessage({type:"stop"})
        openReport()
    })
    chrome.runtime.sendMessage({type:"getState"},function(response){
        if(response.state == "record"){
            toggleButtons(false)
        }
    })
}

function openReport() {
    chrome.tabs.create({ url: chrome.extension.getURL('html/report.html') })
}

