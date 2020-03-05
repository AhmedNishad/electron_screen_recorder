let mediaRecorder; // Media Recorder instance that captures footage
const recordedChunks = [];

// Writing buffer to file system
const {writeFile} = require('fs');

const { desktopCapturer, remote } = require('electron');
const {Menu} = remote;

// Dialog runs on main process
const {dialog} = remote;

const videoElement = document.querySelector('video');

const startButton = document.querySelector('#startBtn');

startButton.onclick = e => {
    mediaRecorder.start();
    startButton.className = 'uk-button uk-button-secondary';
    startButton.innerText = 'Recording...';
}

const stopButton = document.querySelector('#stopBtn');
stopButton.onclick = e => {
    mediaRecorder.stop();
    startButton.className = 'uk-button uk-button-primary';
    startButton.innerText = 'Start';
}

const videoSelectButton = document.querySelector('#vidSelectBtn');
videoSelectButton.onclick = getVideoSources;



// Ge
async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    )

    videoOptionsMenu.popup();
}




async function selectSource(source){

    videoSelectButton.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory:{
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    // Create MediaRecorder
    const options = {mimeType: 'video/webm; codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = HandleDataAvailable;
    mediaRecorder.onstop = HandleStop;
    
} 

function HandleDataAvailable(e){
    // Video data available
    recordedChunks.push(e.data);
}



async function HandleStop(e){
    const blob = new Blob(recordedChunks, {
        type: "video/webm; codecs=vp9"
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    writeFile(filePath, buffer, ()=> console.log("Saved"));
}

//running now