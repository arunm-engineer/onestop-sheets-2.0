export const calculateRowsAndColumnsToDisplay = (size, visibleArea, offset, cellOffset) => {
    const visible = [];
    const start = [];
    const end = [];

    let idx = cellOffset;
    let nextStart = offset;

    while (nextStart < visibleArea) {
        visible.push(idx);
        start.push(nextStart);
        end.push(nextStart + size);

        idx++;
        nextStart += size;
    }

    return { visible, start, end };
}

export const resizeCanvas = (canvas) => {
    const { width, height } = canvas.getBoundingClientRect();

    const ratio = window.devicePixelRatio;

    const newCanvasWidth = Math.round(width * ratio);
    const newCanvasHeight = Math.round(height * ratio);

    const context = canvas.getContext('2d');
    canvas.width = newCanvasWidth;
    canvas.height = newCanvasHeight;
    context.scale(ratio, ratio);
}

export const getEncodedCharacter = (num) => {
    let result = '';

    while (num > 0) {
        const rem = (num - 1) % 26; // 0 to 25
        result = String.fromCharCode(65 + rem) + result;

        num = Math.floor((num - 1) / 26);
    }

    return result;
}

