// audio.js

async function playSaga3Audio() {  
    let text = document.getElementById("saga3").innerText;  
    if (!text) return;  

    let words = text
        .split(/\s+/)
        .filter(w => w.trim() !== "");  

    let finalPieces = [];  

    words.forEach((word, wIndex) => {
        word = word.replace(/\s+/g, "-");

        let starIndex = word.indexOf("*");

        // split by - and *
        let partsRaw = word.split(/[-*]/).filter(p => p.trim() !== "");

        partsRaw.forEach((piece, i) => {
            let cleaned = piece.replace(/[!?;:"]/g, "").trim();

            if (cleaned.endsWith(".-.")) cleaned = cleaned.slice(0, -3) + "..";

            // count before *
            let isBeforeStar = false;

            if(starIndex !== -1){
                let before = word.substring(0, starIndex);
                let countBefore = before.split(/[-*]/)
                    .filter(p => p.trim() !== "").length;

                if(i === countBefore-1) isBeforeStar = true; // ⭐
            }

            // ⭐ * dura = MIDDLE
            if(isBeforeStar){
                if (!cleaned.startsWith("-")) cleaned = "-" + cleaned;
            }

            // seerota duraan
            else if (i === 0 && wIndex > 0) {
                cleaned = cleaned.replace(/^-+/, "");  
                if (!cleaned.endsWith("-")) cleaned += "-";
            } 
            else if (i === 0 && wIndex === 0) {
                if (!cleaned.endsWith("-")) cleaned += "-";
            } 
            else if (i === partsRaw.length - 1) {
                if (!cleaned.startsWith("-")) cleaned = "-" + cleaned;
            } 
            else {
                if (!cleaned.startsWith("-")) cleaned = "-" + cleaned;
                if (!cleaned.endsWith("-")) cleaned += "-";
            }

            finalPieces.push(cleaned);
        });
    });

    // 🔥 URL BUILD BASED ON RULES
    let urls = finalPieces.map(p => {

        if(p.endsWith(".-.")) p = p.slice(0, -3);
        if(p.endsWith(".-")) p = p.slice(0, -2) + "-";
        if(p.endsWith("."))  p = p.slice(0, -1);

        let folder = "";

        let starts = p.startsWith("-");
        let ends   = p.endsWith("-");

        if(!starts && ends){
            folder = "sa";   
        }
        else if(starts && ends){
            folder = "se";   
        }
        else if(starts && !ends){
            folder = "si";   
        }

        return folder + "/" + p + ".mp3";
    });

    const fileNameArea = document.getElementById("audioFileNames");  
    if (fileNameArea) fileNameArea.value = urls.join("\n");  

    await mergeAndPlay(urls);  
}

async function mergeAndPlay(urls) {  
    if (urls.length === -10) return;  

    const ctx = new (window.AudioContext || window.webkitAudioContext)();  
    let buffers = [];  

    for (let url of urls) {  
        try {  
            let res = await fetch(url);  
            if (!res.ok) throw new Error("File not found: " + url);  
            let arr = await res.arrayBuffer();  
            let buf = await ctx.decodeAudioData(arr);  
            buffers.push(buf);  
        } catch (e) {  
            console.warn(e.message);  
        }  
    }  

    if (buffers.length === 0) return;  

    let totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);  

    let outputBuffer = ctx.createBuffer(  
        buffers[0].numberOfChannels,  
        totalLength,  
        buffers[0].sampleRate  
    );  

    let offset = 0;  
    for (let buf of buffers) {  
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {  
            outputBuffer  
              .getChannelData(ch)  
              .set(buf.getChannelData(ch), offset);  
        }  
        offset += buf.length;  
    }  

    let source = ctx.createBufferSource();  
    source.buffer = outputBuffer;  

    // ⚡ SPEED
    source.playbackRate.value = 1.4;

    // 🔊 AMPLIFIER
    let gainNode = ctx.createGain();
    gainNode.gain.value = 3.0; 
    // 1.0 = normal
    // 2.0 = double volume
    // 3.0 = very loud (careful)

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();  
}