import { useRef, useEffect, useState } from 'react'
import { calculateRowsAndColumnsToDisplay, resizeCanvas, getEncodedCharacter } from './Sheet.util'

export const Sheet = (props) => {
    const canvasRef = useRef(null);

    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
    const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
    const [cellsOffset, setCellsOffset] = useState({ x: 0, y: 0 });
    const [maxScrollArea, setMaxScrollArea] = useState({ x: 5000, y: 5000 });

    const [selectionInProgress, setSelectionInProgress] = useState(false);
    const [selection, setSelection] = useState({ x1: -1, y1: -1, x2: -1, y2: -1 });

    const [editCell, setEditCell] = useState({ x: -1, y: -1 });
    const [editValue, setEditValue] = useState('');

    const cellWidth = 100;
    const cellHeight = 22;

    const rowHeaderWidth = 50;
    const columnHeaderHeight = 22;

    const headerColor = '#f8f9fa';
    const gridLineColor = '#e2e3e3';
    const headerTextColor = '#666666';
    const selectionColor = '#e9f0fd';
    const selectionBorderColor = '#1b73e7';

    const { visible: visibleColumns, start: columnStart, end: columnEnd } = calculateRowsAndColumnsToDisplay(
        cellWidth,
        canvasWidth,
        rowHeaderWidth,
        cellsOffset.x
    );

    const { visible: visibleRows, start: rowStart, end: rowEnd } = calculateRowsAndColumnsToDisplay(
        cellHeight,
        canvasHeight,
        columnHeaderHeight,
        cellsOffset.y
    );

    const coordinateToCell = (x, y) => {
        let cellX = 0;
        let cellY = 0;

        for (let i = 0; i < visibleColumns.length; i++) {
            if (x >= columnStart[i] && x <= columnEnd[i]) {
                cellX = visibleColumns[i];
            }
        }

        for (let i = 0; i < visibleRows.length; i++) {
            if (y >= rowStart[i] && y <= rowEnd[i]) {
                cellY = visibleRows[i];
            }
        }

        return { x: cellX, y: cellY };
    }

    const cellToCoordinate = (cellX, cellY) => {
        let x = 0;
        let y = 0;

        let idx = visibleColumns.findIndex(i => i === cellX);
        if (idx !== -1) {
            x = columnStart[idx];
        }
        else {
            x = (cellX - cellsOffset.x) * cellWidth;
        }

        idx = visibleRows.findIndex(i => i === cellY);
        if (idx !== -1) {
            y = rowStart[idx];
        }
        else {
            y = (cellY - cellsOffset.y) * cellHeight;
        }


        return { x, y };
    }

    useEffect(() => {
        const id = requestAnimationFrame(() => {

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            resizeCanvas(canvas);

            context.fillStyle = 'white';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);

            // Selecting cells

            let selX1 = selection.x1;
            let selX2 = selection.x2;

            if (selection.x1 > selection.x2) {
                selX1 = selection.x2;
                selX2 = selection.x1;
            }

            let selY1 = selection.y1;
            let selY2 = selection.y2;

            if (selection.y1 > selection.y2) {
                selY1 = selection.y2;
                selY2 = selection.y1;
            }

            const isSelectionActive = selX1 !== -1 && selY1 !== -1 && selX2 !== -1 && selY2 !== -1;

            const point1 = cellToCoordinate(selX1, selY1);
            const point2 = cellToCoordinate(selX2, selY2);

            point2.x += cellWidth;
            point2.y += cellHeight;

            if (isSelectionActive) {
                const rectWidth = point2.x - point1.x;
                const rectHeight = point2.y - point1.y;

                context.fillStyle = selectionColor;
                context.fillRect(point1.x, point1.y, rectWidth, rectHeight);
            }

            // Draw row lines
            let startY = columnHeaderHeight;

            context.strokeStyle = gridLineColor;

            for (const row of visibleRows) {
                context.beginPath();
                context.moveTo(rowHeaderWidth, startY); // x, y
                context.lineTo(context.canvas.width, startY); // x, y
                context.stroke();

                startY += cellHeight;
            }

            // Draw col lines
            let startX = rowHeaderWidth;

            for (const col of visibleColumns) {
                context.beginPath();
                context.moveTo(startX, columnHeaderHeight); // x, y
                context.lineTo(startX, context.canvas.height); // x, y
                context.stroke();

                startX += cellWidth;
            }

            // Draw row header
            startY = columnHeaderHeight;

            context.fillStyle = headerColor;
            context.fillRect(0, 0, rowHeaderWidth, context.canvas.height);

            for (const row of visibleRows) {
                context.beginPath();
                context.moveTo(0, startY); // x, y
                context.lineTo(rowHeaderWidth, startY); // x, y
                context.stroke();

                startY += cellHeight;
            }

            // Draw col header
            startX = rowHeaderWidth;

            context.fillRect(0, 0, context.canvas.width, columnHeaderHeight);

            for (const col of visibleColumns) {
                context.beginPath();
                context.moveTo(startX, 0); // x, y
                context.lineTo(startX, columnHeaderHeight); // x, y
                context.stroke();

                startX += cellWidth;
            }

            // Write col header text
            startX = rowHeaderWidth;

            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.font = '13px sans-serif';
            context.fillStyle = headerTextColor;

            for (const col of visibleColumns) {
                const centerX = startX + (cellWidth * 0.5);
                const centerY = columnHeaderHeight * 0.5;

                const content = getEncodedCharacter(col + 1);
                context.fillText(content, centerX, centerY);

                startX += cellWidth;
            }

            // Write row header text
            startY = columnHeaderHeight;

            for (const row of visibleRows) {
                const centerX = rowHeaderWidth * 0.5;
                const centerY = startY + (cellHeight * 0.5);

                const content = row + 1;
                context.fillText(content, centerX, centerY);

                startY += cellHeight;
            }

            if (isSelectionActive) {
                const rectWidth = point2.x - point1.x;
                const rectHeight = point2.y - point1.y;

                context.strokeStyle = selectionBorderColor;
                context.rect(point1.x, point1.y, rectWidth, rectHeight);
                context.stroke();
            }


            // Write cells content
            let yCoord = columnHeaderHeight;

            context.textBaseline = 'middle';
            context.textAlign = 'left';
            context.fillStyle = 'black';

            for (const row of visibleRows) {
                let xCoord = rowHeaderWidth;

                for (const col of visibleColumns) {
                    const content = props?.displayData?.[row]?.[col];

                    if (content) {
                        const x = xCoord + 5;
                        const y = yCoord + (cellHeight * 0.5);

                        context.fillText(content, x, y);
                    }

                    xCoord += cellWidth;
                }
                yCoord += cellHeight
            }

        })

        return () => cancelAnimationFrame(id);
    }, [
        canvasWidth,
        canvasHeight,
        cellsOffset.x,
        cellsOffset.y,
        selection,
        props.displayData
    ])

    useEffect(() => {
        const resizeCanvas = () => {
            setCanvasWidth(window.innerWidth);
            setCanvasHeight(window.innerHeight);
        }

        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [])

    const onScroll = (e) => {
        const scrollX = e.target.scrollLeft;
        const scrollY = e.target.scrollTop;

        const cellsOffsetInX = Math.floor(scrollX / cellWidth);
        const cellsOffsetInY = Math.floor(scrollY / cellHeight);
        setCellsOffset({ x: cellsOffsetInX, y: cellsOffsetInY });

        const newMaxScrollArea = { ...maxScrollArea };

        if (maxScrollArea.x / scrollX < 1) {
            newMaxScrollArea.x *= 1.5;
        }

        if (maxScrollArea.y / scrollY < 1) {
            newMaxScrollArea.y *= 1.5;
        }

        setMaxScrollArea({ ...newMaxScrollArea });
    }

    const onMouseDown = (e) => {
        const x = e.clientX;
        const y = e.clientY;

        setSelectionInProgress(true);

        const sel1 = coordinateToCell(x, y); // point1
        const sel2 = { ...sel1 }; // point2

        setSelection({ x1: sel1.x, y1: sel1.y, x2: sel2.x, y2: sel2.y });
    }

    const onMouseMove = (e) => {
        const x = e.clientX;
        const y = e.clientY;

        if (selectionInProgress) {
            const sel2 = coordinateToCell(x, y);
            setSelection({ ...selection, x2: sel2.x, y2: sel2.y });
        }
    }

    const onMouseUp = () => {
        setSelectionInProgress(false);
    }

    const onDoubleClick = (e) => {
        const x = e.clientX;
        const y = e.clientY;

        const cell = coordinateToCell(x, y);
        setEditCell({ x: cell.x, y: cell.y });

        const content = props?.displayData?.[cell.y]?.[cell.x];
        if (content) setEditValue(content);
    }

    const onCellKeyDown = (e) => {
        if (e.key === 'Enter') {
            props.onChange?.([{ x: editCell.x, y: editCell.y, value: editValue }]);
            setEditValue('');

            setEditCell({ x: -1, y: -1 });
        }
    }

    const onCopy = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(JSON.stringify(selection));
    }

    const onPaste = (e) => {
        e.preventDefault();

        navigator.clipboard.readText()
            .then(data => {
                try {
                    const cSelection = JSON.parse(data);

                    let selX1 = cSelection.x1;
                    let selX2 = cSelection.x2;

                    if (cSelection.x1 > cSelection.x2) {
                        selX1 = cSelection.x2;
                        selX2 = cSelection.x1;
                    }

                    let selY1 = cSelection.y1;
                    let selY2 = cSelection.y2;

                    if (cSelection.y1 > cSelection.y2) {
                        selY1 = cSelection.y2;
                        selY2 = cSelection.y1;
                    }

                    const xLen = Math.abs(selX1 - selX2);
                    const yLen = Math.abs(selY1 - selY2);

                    const changes = [];
                    for (let y = 0; y <= yLen; y++) {
                        for (let x = 0; x <= xLen; x++) {
                            const value = props.displayData?.[selY1 + y]?.[selX1 + x];
                            changes.push({ x: selection.x1 + x, y: selection.y1 + y, value });
                        }
                    }

                    props.onChange?.(changes);
                    setSelection({ x1: selection.x1, y1: selection.y1, x2: selection.x2 + xLen, y2: selection.y2 + yLen });
                }
                catch (e) { }
            })
    }

    const editMode = editCell.x !== -1 && editCell.y !== -1;
    let position = { x: 0, y: 0 };
    let editWidth = 0;
    let editHeight = 0;

    if (editMode) {
        position = cellToCoordinate(editCell.x, editCell.y);
        position.x += 1;
        position.y += 1;
        editWidth = cellWidth - 2;
        editHeight = cellHeight - 2;
    }

    return (

        <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ height: '100%', width: '100%' }} />
            <div
                onCopy={onCopy}
                onPaste={onPaste}
                onScroll={onScroll}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onDoubleClick={onDoubleClick}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    overflow: 'scroll'
                }}
            >
                {/* For Horizontal Scrolling */}
                <div style={{ width: maxScrollArea.x + 2000 + 'px', height: '1px' }} />
                {/* For Vertical Scrolling */}
                <div style={{ width: '1px', height: maxScrollArea.y + 2000 + 'px' }} />
            </div>

            {editMode &&
                <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={onCellKeyDown}
                    style={{
                        position: 'absolute',
                        top: position.y,
                        left: position.x,
                        width: editWidth,
                        height: editHeight,
                        outline: 'none',
                        border: 'none',
                        color: 'black',
                        fontSize: '13px',
                        fontFamily: 'sans-serif'
                    }}
                />
            }
        </div>
    )
}