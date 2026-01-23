async function playSaga3Audio() {  
    let text = document.getElementById("saga3").innerText;  
    if (!text) return;  

    let words = text.split(/\s+/).filter(Boolean);  
    let finalPieces = [];  

    words.forEach((word, wIndex) => {

        // tokenization: - , * addaan baasna
        let tokens = word.split(/(-|\*)/).filter(Boolean);

        let pieces = [];

        for (let i = 0; i < tokens.length; i++) {
            let t = tokens[i];

            if (t === "-" || t === "*") continue;

            let cleaned = t.replace(/[!?;:"]/g, "").trim();

            let prev = tokens[i - 1];
            let next = tokens[i + 1];

            let starts = prev === "-" || prev === "*";
            let ends   = next === "-";

            // ⭐ yoo next "*" ta'e → dhumaa hin qabaatu
            if (next === "*") ends = false;

            if (starts) cleaned = "-" + cleaned;
            if (ends)   cleaned = cleaned + "-";

            // jalqaba jecha
            if (i === 0 && !cleaned.endsWith("-")) cleaned += "-";

            // dhuma jecha
            if (i === tokens.length - 1 && !cleaned.startsWith("-"))
                cleaned = "-" + cleaned;

            pieces.push(cleaned);
        }

        finalPieces.push(...pieces);
    });

    let urls = finalPieces.map(p => {
        let starts = p.startsWith("-");
        let ends   = p.endsWith("-");

        let folder = "";
        if (!starts && ends) folder = "sa";
        else if (starts && ends) folder = "se";
        else if (starts && !ends) folder = "si";

        return folder + "/" + p + ".mp3";
    });

    document.getElementById("audioFileNames").value = urls.join("\n");
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

    // 👃 Nasal sound removal - Notch filter at 500 Hz
    const nasalFilter = ctx.createBiquadFilter();
    nasalFilter.type = "notch";
    nasalFilter.frequency.value = 500; // adjust frequency if needed
    nasalFilter.Q.value = 100; // quality factor, narrow notch

    source.connect(nasalFilter);
    nasalFilter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();  
}