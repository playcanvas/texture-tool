class HdrExporter {
    constructor() {
        this.encoder = new TextEncoder();
    }

    run(words, width, height) {
        const header = this.encoder.encode(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`);
        const result = new Uint8Array(width * height * 4 + header.length);
        result.set(header);
        result.set(new Uint8Array(words.buffer), header.length);
        return result;
    }

    get extension() {
        return 'hdr';
    }
}

export {
    HdrExporter
};