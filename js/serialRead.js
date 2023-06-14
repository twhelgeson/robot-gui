export let value
const button = document.querySelector('button');
button.addEventListener('click', async function() {

	// Prompt user to select any serial port.
	const port = await navigator.serial.requestPort();

	// Wait for the serial port to open.
	await port.open({ baudRate: 9600 });

	button.style.display = 'none'

	//const reader = port.readable.getReader();

	/*
	const textDecoder = new TextDecoderStream();
	const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
	const reader = textDecoder.readable.getReader(); */

	class LineBreakTransformer {
		constructor() {
			// A container for holding stream data until a new line.
			this.chunks = "";
		}

		transform(chunk, controller) {
			// Append new chunks to existing chunks.
			this.chunks += chunk;
			// For each line breaks in chunks, send the parsed lines out.
			const lines = this.chunks.split("\r\n");
			this.chunks = lines.pop();
			lines.forEach((line) => controller.enqueue(line));
		}

		flush(controller) {
			// When the stream is closed, flush any remaining chunks out.
			controller.enqueue(this.chunks);
		}
	}

	const textDecoder = new TextDecoderStream();
	const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
	const reader = textDecoder.readable
	.pipeThrough(new TransformStream(new LineBreakTransformer()))
	.getReader();

	// Listen to data coming from the serial device.
	while (true) {
        let done
		({ value, done }) = await reader.read();
		//const value = await reader.read();
		
		if (done) {
			// Allow the serial port to be closed later.
			reader.releaseLock();
			break;
	}
	// value is a Uint8Array.
	// console.log(value);
	}
});