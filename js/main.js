
/*
* Take screenshot of page
* */
const takeScreenshot = async () => {
    await html2canvas(document.querySelector("html")).then(canvas => {
        if (document.getElementById('screenshotCanvas')) {
            document.getElementById('screenshotCanvas').remove();
        }

        canvas.style = 'width: 0px; height: 0px;';
        canvas.id = 'screenshotCanvas';
        document.getElementById('screenshotCanvasContainer').appendChild(canvas);
    });
}


/*
* Convert textarea to plain text
* */
const convertTextareaToPlain = () => {
    const txtArea = document.getElementById('textArea');
    const comment = document.getElementById('comment');
    const text = txtArea.value;
    txtArea.remove();

    const p = document.createElement('p');
    p.innerText = text;
    p.id = 'taReplacement';
    p.className = 'border rounded border-dark border-1 p-2';
    comment.appendChild(p);
    return text;
}


/*
* Convert plain to textarea
* */
const convertPlainToTextarea = (text) => {
    const plain = document.getElementById('taReplacement');
    const comment = document.getElementById('comment');

    plain.remove();
    const txtArea = createTextArea();
    txtArea.value = text;
    comment.appendChild(txtArea);
}


/*
* Create and download result archive
* */
const createAndDownloadArchive = async () => {
    const zip = new JSZip();
    const files = document.getElementById('fileInput').files;
    const legend = document.querySelectorAll('ul > li > input');
    const reportName = document.getElementById('textInput');
    const archiveName = reportName.value === '' ? 'perf_report' : reportName.value;

    for (let i = 0; i < files.length; i++) {
        const fileName = legend[i].value === '' ? legend[i].placeholder : legend[i].value;
        zip.file(`${fileName}.csv`, files[i]);
    }

    const text = convertTextareaToPlain();
    await takeScreenshot().then(() => {
        const canvas = document.getElementById('screenshotCanvas');
        const canvasBase64 = canvas.toDataURL().split(',')[1];
        zip.file(`${archiveName}.png`, canvasBase64, {base64: true});

        convertPlainToTextarea(text);
    })
    zip.file(`comment.txt`, text);

    zip.generateAsync({ type:"blob" }).then((content) => {
        saveAs(content, `${archiveName}.zip`);
    });
}


/*
* Parameter for coloring fps chart grid
* */
const gridParamForFpsChart = {
    color: function (context) {
        if (context.tick.value === 60) {
            return 'rgb(230,0,0)';
        }
        return '#00000033';
    }
};


/*
* Chart colors
* */
const CHART_COLORS = {
    0: '#e50808',
    1: '#087aec',
    2: '#fad000',
    3: '#29be0b',
    4: '#170101'
};


/*
* Background colors
* */
const BACKGROUND_COLORS = {
    0: '#e5080880',
    1: '#087aec80',
    2: '#fad00080',
    3: '#29be0b80',
    4: '#17010180'
};


/*
* Point styles
* */
const POINT_STYLES = {
    0: 'circle',
    1: 'triangle',
    2: 'rectRot',
    3: 'rect',
    4: 'star',
};


/*
* Y-axis chart parameters
* */
const PARAMS = {
    waypointIndex: 'waypointIndex',
    fpsMeasure: 'fpsMeasure',
    gameUpdate: 'gameUpdate',
    renderMeasurer: 'renderMeasurer',
    frameMeasurer: 'frameMeasurer',
    diskIdle: 'diskIdle',
    diskRead: 'diskRead',
    diskWrite: 'diskWrite',
    vram: 'vram',
    memoryMB: 'memoryMB',
    memoryPercent: 'memoryPercent',
    desiredTexMem: 'desiredTexMem',
    totalReservedMem: 'totalReservedMem',
    gpuUtilization: 'gpuUtilization'
};


/*
* Make element visible
* */
const makeVisible = (id) => {
    document.getElementById(id).classList.remove('invisible');
    document.getElementById(id).classList.add('visible');
}


/*
* Copy string to clipboard
* */
const copyToClipboard = (value) => {
    navigator.clipboard.writeText(value);
}


/*
* Get data, decomposes into arrays and returns object with these arrays
* */
const getCsvDataObject = async (objectURL) => {
    let waypointIndex = [], playerPosition = [], playerRotation = [], fpsMeasure = [], gameUpdate = [],
        renderMeasurer = [], frameMeasurer = [], diskIdle = [], diskRead = [], diskWrite = [], vram = [], memoryMB = [],
        memoryPercent = [], desiredTexMem = [], totalReservedMem = [], gpuUtilization = [];

    const dataPoints = await d3.dsv(';', objectURL);

    for (let i = 0; i < dataPoints.length; i++) {
        waypointIndex.push(dataPoints[i]['waypoint_index']);
        playerPosition.push(dataPoints[i]['player_position']);
        playerRotation.push(dataPoints[i]['player_rotation']);
        fpsMeasure.push(dataPoints[i]['fps_measure']);
        gameUpdate.push(dataPoints[i]['game_update']);
        renderMeasurer.push(dataPoints[i]['render_measurer']);
        frameMeasurer.push(dataPoints[i]['frame_measurer']);
        diskIdle.push(dataPoints[i]['disk_idle %']);
        diskRead.push(dataPoints[i]['disk_read KB/s']);
        diskWrite.push(dataPoints[i]['disk_write KB/s']);
        vram.push(dataPoints[i]['VRAM MB']);
        memoryMB.push(dataPoints[i]['Memory MB']);
        memoryPercent.push(dataPoints[i]['Memory %']);
        desiredTexMem.push(dataPoints[i]['Desired Tex Mem MB']);
        totalReservedMem.push(dataPoints[i]['Total Reserved Mem, MB']);
        gpuUtilization.push(dataPoints[i][' GPU Utilization %']);
    }

    return  {
        'waypointIndex': waypointIndex,
        'playerPosition': playerPosition,
        'playerRotation': playerRotation,
        'fpsMeasure': fpsMeasure,
        'gameUpdate': gameUpdate,
        'renderMeasurer': renderMeasurer,
        'frameMeasurer': frameMeasurer,
        'diskIdle': diskIdle,
        'diskRead': diskRead,
        'diskWrite': diskWrite,
        'vram': vram,
        'memoryMB': memoryMB,
        'memoryPercent': memoryPercent,
        'desiredTexMem': desiredTexMem,
        'totalReservedMem': totalReservedMem,
        'gpuUtilization': gpuUtilization
    };
}


/*
* Get object with data settings for the chart
* */
const getSetup = (parsedData, param) => {
    const data = {
        labels: Object.values(parsedData)[0].waypointIndex,
        datasets: []
    }

    for (let i = 0; i < Object.keys(parsedData).length; i++) {
        data.datasets.push({
            label: Object.keys(parsedData)[i],
            data: Object.values(parsedData)[i][param],
            borderColor: Object.values(CHART_COLORS)[i],
            backgroundColor: Object.values(BACKGROUND_COLORS)[i],
            pointStyle: Object.values(POINT_STYLES)[i],
            pointRadius: 2,
            pointHoverRadius: 10,
            borderWidth: 1,
        });

        const values = Object.values(parsedData);
        if (i > 0 && values[i].waypointIndex.length > values[i - 1].waypointIndex.length) {
            data.labels = values[i].waypointIndex;
        }
    }

    return data;
}


/*
* Get formatted coordinates
* */
const getFormattedCoordinates = (coordinates) => {
    const coordinatesArray = coordinates.split(' ');
    return `${coordinatesArray[0]}, ${coordinatesArray[1]}, ${coordinatesArray[2]}`;
}


/*
* Get formatted coordinates
* */
const getFormattedRotation = (rotation) => {
    const rotationArray = rotation.split(' ');
    return `${rotationArray[0]}, ${rotationArray[1]}`;
}


/*
* Get or create custom HTML legend
* */
const getOrCreateLegendList = (chart, id) => {

    const legendContainer = document.getElementById(id);
    let listContainer = legendContainer.querySelector('ul');

    if (!listContainer) {
        listContainer = document.createElement('ul');
        listContainer.id = 'listContainer';
        listContainer.className = 'd-flex flex-row justify-content-center align-items-center w-100 m-0 p-0 pb-1';
        legendContainer.appendChild(listContainer);
    }
    return listContainer;
};


/*
* Object for storing the latest legend names
* */
let lastLegendNames = {};


/*
* Get placeholder for html legend
* */
const getPlaceholder = (fileName) => {
    return fileName.replace(/.+\.(\d+\w+).*/, '$1');
}


/*
* Parameter for custom HTML legend
* */
const htmlLegendPlugin = {
    id: 'htmlLegend',
    async afterUpdate(chart, args, options) {
        const ul = await getOrCreateLegendList(chart, options.containerID);

        while (ul.firstChild) {
            ul.firstChild.remove();
        }

        const items = chart.options.plugins.legend.labels.generateLabels(chart);

        items.forEach(item => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.className = 'd-flex flex-row justify-content-center align-items-center ps-3'

            const boxSpan = document.createElement('span');
            boxSpan.style.background = item.fillStyle;
            boxSpan.style.borderColor = item.strokeStyle;
            boxSpan.style.borderWidth = item.lineWidth + 'px';
            boxSpan.style.display = 'inline-block';
            boxSpan.style.height = '20px';
            boxSpan.style.marginRight = '10px';
            boxSpan.style.width = '20px';

            boxSpan.onclick = () => {
                const {type} = chart.config;
                if (type === 'pie' || type === 'doughnut') {
                    chart.toggleDataVisibility(item.index);
                } else {
                    chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
                }
                chart.update();
            };

            const textField = document.createElement('input');

            textField.type = 'text';
            textField.size = 22;
            textField.placeholder = getPlaceholder(item.text);
            textField.value = lastLegendNames[item.text] === undefined ? '' : lastLegendNames[item.text];
            textField.className = 'm-0 p-0 border-0 bg-transparent';
            textField.onchange = () => {
                const newName = textField.value;
                if (item.text !== newName) {
                    lastLegendNames[item.text] = newName;
                }
            }

            li.appendChild(boxSpan);
            li.appendChild(textField);
            ul.appendChild(li);
        });
    }
};


/*
* Get config with chart settings
* */
const getConfig = (parsedData, data, param) => {
    const config = {
        type: 'line',
        data: data,
        options: {
            animation: false,
            plugins: {
                htmlLegend: {
                    containerID: 'legendContainer',
                },
                legend: {
                    display: false,
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    }
                },
                tooltip: {
                    usePointStyle: true,
                    enabled: true,
                    position: 'nearest',
                    callbacks: {

                        /*
                        * Title setup
                        * */
                        title: (tooltipItems) => {
                            const datasetIndex = tooltipItems[0].datasetIndex;
                            const dataIndex = tooltipItems[0].dataIndex;
                            const waypoint = Object.values(parsedData)[datasetIndex][PARAMS.waypointIndex][dataIndex];
                            return `Waypoint: ${waypoint}`;
                        },

                        /*
                        * Before label setup
                        * */
                        beforeLabel: (context) => {
                            const yValue = context.formattedValue;
                            return `  ${param}: ${yValue}`;
                        },

                        /*
                        * Label setup
                        * */
                        label: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            const coordinates = Object.values(parsedData)[datasetIndex].playerPosition[dataIndex];
                            const rotation = Object.values(parsedData)[datasetIndex].playerRotation[dataIndex];

                            const formattedCoordinates = getFormattedCoordinates(coordinates);
                            const formattedRotation = getFormattedRotation(rotation)

                            document.getElementById('chartCanvas').addEventListener('click', () => {
                                copyToClipboard(`tp ${formattedCoordinates}${formattedRotation}`);
                            });

                            return `  Coordinates: ${formattedCoordinates}`;
                        },

                        /*
                        * After label setup
                        * */
                        afterLabel: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            const rotation = Object.values(parsedData)[datasetIndex].playerRotation[dataIndex];
                            const formattedRotation = getFormattedRotation(rotation);

                            return `  Rotation: ${formattedRotation}`;
                        }
                    },
                }
            },
            scales: {
                y: {
                    min: 0,
                },
            }
        },
        plugins: [htmlLegendPlugin]
    };
    if (param === PARAMS.fpsMeasure) {
        config.options.scales.y['grid'] = gridParamForFpsChart;
        config.options.scales.y['ticks'] = { stepSize: 5 };
    }
    return config;
}


/*
* Render chart on canvas
* */
const renderChart = (config) => {
    new Chart(
        document.getElementById('chartCanvas'),
        config
    );
}


/*
* Get files from input, takes data from each csv and returns object with full data from all cvs
* */
const getParsedData = async () => {
    const parsedData = {};
    const inputLength = fileInput.files.length;

    for (let i = 0; i < inputLength; i++) {
        const currentFile = fileInput.files[i];
        const objectURL = window.URL.createObjectURL(currentFile);
        parsedData[currentFile.name] = await getCsvDataObject(objectURL);
    }
    return parsedData;
}


/*
* Create a chart and makes the select visible
* */
const createChart = (param, parsedData) => {
    const data = getSetup(parsedData, param);
    const config = getConfig(parsedData, data, param);

    renderChart(config);

    makeVisible('select');
}


/*
* Create or update chart canvas
* */
const updateChart = (value, parsedData) => {
    if (Chart.getChart('chartCanvas') === undefined) {
        createChart(value, parsedData);
    } else {
        Chart.getChart('chartCanvas').destroy();
        createChart(value, parsedData);
    }
}


/*
* Calculate % above 60 FPS for summary table
* */
const calcPercentAbove60FPS = (dataValues, dataset) => {
    const above60Count = dataValues[dataset].fpsMeasure.filter(val => val > 60).length;
    const totalCount = dataValues[dataset].fpsMeasure.length;
    return Number(above60Count / totalCount * 100).toFixed(2);
}


/*
* Calculate max value from array for summary table
* */
const calcMax = (dataValues, dataset, param) => {
    const paramArray = dataValues[dataset][param];
    const mappedToNumbers = paramArray.map(x => Number(x));
    return Math.max(...mappedToNumbers);
}


/*
* Calculate average value from array for summary table
* */
const calcAverage = (dataValues, dataset, param) => {
    const paramArray = dataValues[dataset][param];
    return Number(
        paramArray.reduce((x1, x2) => Number(x1) + Number(x2), 0) / paramArray.length
    ).toFixed(2);
}


/*
* Calculate delta as absolute value for summary table
* */
const calcDeltaAbs = (lastCol, prevCol) => {
    if (lastCol === undefined || lastCol === '' ||
        prevCol === undefined || prevCol === '') {
        return '';
    }
    const deltaAbs = Number(lastCol - prevCol).toFixed(2);
    return deltaAbs > 0 ? `+${deltaAbs}` : `${deltaAbs}`;
}


/*
* Calculate delta as percentage for summary table
* */
const calcDeltaPercent = (lastCol, prevCol) => {
    if (lastCol === undefined || lastCol === '' ||
        prevCol === undefined || prevCol === '') {
        return '';
    }
    const deltaPercent = Number(lastCol / prevCol * 100 - 100).toFixed(2);
    return deltaPercent > 0 ? `+${deltaPercent}` : `${deltaPercent}`;
}


/*
* Get class for coloring cell, depending on parameter
* */
const getColorForDelta = (row, delta) => {
    const red = 'table-danger';
    const green = 'table-success';
    const yellow = 'table-warning';

    switch (row) {
        case 0: // % Above 60 FPS
        case 1: return delta > 0 ? green : delta < 0 ? red : yellow; // AVG FPS

        case 2: // AVG Game Update
        case 3: // AVG Render Measure
        case 4: // AVG Frame Measure
        case 5: // AVG VRAM
        case 6: // MAX VRAM,
        case 7: // AVG GPU Utilization
        case 8: // AVG Memory
        case 9: // MAX Memory
        case 10: // MAX Disk Read
        case 11: // MAX Disk Write
        case 12: // AVG Disk Idle
        case 13: // MAX Reserved Memory
        case 14: return delta > 0 ? red : delta < 0 ? green : yellow; // MAX Desired Tex Memory
    }
}


/*
* Swap columns with index columnIndex1 and columnIndex2
* */
const swapColumns = (table, colIndex1, colIndex2) => {
    const headRow = table.querySelector('thead > tr');
    const rows = table.querySelectorAll("tbody > tr");

    headRow.insertBefore(headRow.children[colIndex1], headRow.children[colIndex2]);
    for(const row of rows){
        row.insertBefore(row.children[colIndex1], row.children[colIndex2]);
    }
}


/*
* Get calculated row value
* */
const getCalculatedRowValue = (rowIndex, dataValues, datasetIndex) => {
    switch (rowIndex) {
        case '% above 60 FPS':
            return calcPercentAbove60FPS(dataValues, datasetIndex);
        case 'AVG FPS':
            return calcAverage(dataValues, datasetIndex, PARAMS.fpsMeasure);
        case 'AVG Game Update':
            return calcAverage(dataValues, datasetIndex, PARAMS.gameUpdate);
        case 'AVG Render Measure':
            return calcAverage(dataValues, datasetIndex, PARAMS.renderMeasurer);
        case 'AVG Frame Measure':
            return calcAverage(dataValues, datasetIndex, PARAMS.frameMeasurer);
        case 'AVG Disk Idle, %':
            return calcAverage(dataValues, datasetIndex, PARAMS.diskIdle);
        case 'MAX Disk Read, kb\\s':
            return calcMax(dataValues, datasetIndex, PARAMS.diskRead);
        case 'MAX Disk Write, kb\\s':
            return calcMax(dataValues, datasetIndex, PARAMS.diskWrite);
        case 'MAX VRAM, mb':
            return calcMax(dataValues, datasetIndex, PARAMS.vram);
        case 'AVG VRAM, mb':
            return calcAverage(dataValues, datasetIndex, PARAMS.vram);
        case 'MAX Memory, mb':
            return calcMax(dataValues, datasetIndex, PARAMS.memoryMB);
        case 'AVG Memory, %':
            return calcAverage(dataValues, datasetIndex, PARAMS.memoryPercent);
        case 'MAX Desired Tex Memory, mb':
            return calcMax(dataValues, datasetIndex, PARAMS.desiredTexMem);
        case 'MAX Reserved Memory, mb':
            return calcMax(dataValues, datasetIndex, PARAMS.totalReservedMem);
        case 'AVG GPU Utilization, %':
            return calcAverage(dataValues, datasetIndex, PARAMS.gpuUtilization);
    }
}


/*
* Get cell by row and column index
* */
const getCell = (rowIndex, colIndex) => {
    return document.getElementById('summaryTable').rows[rowIndex].cells[colIndex];
}


/*
* Fill delta cells
* */
const fillDeltaCells = (table) => {
    const rows = table.rows.length;
    const cols = table.rows[0].cells.length;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (i !== 0 && j === cols - 2) {
                const currentDelta = calcDeltaAbs(
                    getCell(i, j - 1).textContent,
                    getCell(i, j - 2).textContent
                );
                getCell(i, j).textContent = currentDelta;
                getCell(i, j).className = getColorForDelta(i - 1, currentDelta);
            }
            if (i !== 0 && j === cols - 1) {
                const currentDelta = calcDeltaPercent(
                    getCell(i, j - 2).textContent,
                    getCell(i, j - 3).textContent
                );

                if (isFinite(currentDelta) && currentDelta !== '') {
                    getCell(i, j).textContent = `${currentDelta}%`;
                } else {
                    getCell(i, j).textContent = '';
                }

                getCell(i, j).className = getColorForDelta(i - 1, currentDelta);
            }
        }
    }
}


/*
* Create summary table based on all data, next do all calculations and fill in table
* */
const createTable = (parsedData) => {
    const dataKeys = Object.keys(parsedData);
    const dataValues = Object.values(parsedData);
    const rowNames = [
        '% above 60 FPS',
        'AVG FPS',
        'AVG Game Update',
        'AVG Render Measure',
        'AVG Frame Measure',
        'AVG VRAM, mb',
        'MAX VRAM, mb',
        'AVG GPU Utilization, %',
        'AVG Memory, %',
        'MAX Memory, mb',
        'MAX Disk Read, kb\\s',
        'MAX Disk Write, kb\\s',
        'AVG Disk Idle, %',
        'MAX Reserved Memory, mb',
        'MAX Desired Tex Memory, mb'
    ];

    if (document.getElementById('head') && document.getElementById('head')) {
        document.getElementById('head').remove();
        document.getElementById('body').remove();
    }

    const table = document.getElementById('summaryTable');

    const head = document.createElement('thead');
    head.id = 'head';
    const tr = document.createElement('tr');
    tr.className = 'table-primary';
    const thMap = document.createElement('th');
    thMap.scope = 'col';
    thMap.textContent = `tableName`;
    thMap.contentEditable = 'true';
    tr.appendChild(thMap);
    for (let i = 0; i < dataKeys.length; i++) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = getPlaceholder(Object.keys(parsedData)[i]);
        th.style.color = CHART_COLORS[i];
        th.contentEditable = 'true';
        tr.appendChild(th);
    }

    const thDeltaAbs = document.createElement('th');
    thDeltaAbs.scope = 'col';
    thDeltaAbs.textContent = '??, abs';
    thDeltaAbs.style.cursor = 'pointer';
    thDeltaAbs.onclick = () => {
        swapColumns(table, dataKeys.length, dataKeys.length - 1);
        fillDeltaCells(table);
    };

    const thDeltaPercent = document.createElement('th');
    thDeltaPercent.scope = 'col';
    thDeltaPercent.textContent = '??, %';
    thDeltaPercent.style.cursor = 'pointer';
    thDeltaPercent.onclick = () => {
        swapColumns(table, dataKeys.length, dataKeys.length - 1);
        fillDeltaCells(table);
    };

    tr.appendChild(thDeltaAbs);
    tr.appendChild(thDeltaPercent);
    head.appendChild(tr);
    table.appendChild(head);

    const body = document.createElement('tbody');
    body.id = 'body';
    for (let i = 0; i < rowNames.length; i++) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = rowNames[i];
        tr.appendChild(th);

        for (let j = 0; j < dataKeys.length; j++) {
            const td = document.createElement('td');
            const val = getCalculatedRowValue(rowNames[i], dataValues, j);
            if (val === undefined || isNaN(val) || !isFinite(val)) {
                td.textContent = '';
            } else {
                td.textContent = val;
            }

            tr.appendChild(td);

            if (j === dataKeys.length - 1) {
                const td1 = document.createElement('td');
                const td2 = document.createElement('td');
                tr.appendChild(td1);
                tr.appendChild(td2);
            }
        }
        body.appendChild(tr);
    }
    table.appendChild(body);
    fillDeltaCells(table, rowNames, dataKeys);
}


/*
* Create textarea
* */
const createTextArea = () => {
    const txtArea = document.createElement('textarea');
    txtArea.className = 'form-control w-100';
    txtArea.rows = 7;
    txtArea.id = 'textArea';
    return txtArea;
}


/*
* Create label and textarea on page
* */
const createTextAreaAndLabel = () => {
    const comment = document.getElementById('comment');
    if (document.getElementById('taLabel') && document.getElementById('textArea')) {
        document.getElementById('taLabel').remove();
        document.getElementById('textArea').remove();
    }

    const taLabel = document.createElement('label');
    taLabel.id = 'taLabel';
    taLabel.htmlFor = 'textArea';
    taLabel.className = 'form-label';
    taLabel.textContent = 'Comment:';

    const txtArea = createTextArea();

    comment.appendChild(taLabel);
    comment.appendChild(txtArea);
}


/*
* Create label and text field on page
* */
const createTextField = () => {
    const customNameDiv = document.getElementById('customChartName');
    if (document.getElementById('textInput')) {
        document.getElementById('textInput').remove();
    }

    const txtInput = document.createElement('input');
    txtInput.id = 'textInput';
    txtInput.className = 'border-0 bg-transparent';
    txtInput.size = 50;
    txtInput.placeholder = 'Report name...';
    txtInput.type = 'text';
    txtInput.style.fontSize = '15px';
    txtInput.style.fontWeight = 'bold';
    txtInput.style.textAlign= 'center';

    customNameDiv.appendChild(txtInput);
}


/*
* Create save button
* */
const createSaveButton = () => {
    const saveButtonDiv = document.getElementById('saveButtonDiv');
    if (document.getElementById('save')) {
        document.getElementById('save').remove();
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'save';
    button.className = 'btn btn-outline-success btn-md';
    button.onclick = () => {
        const screenshotCanvas = takeScreenshot();
        createAndDownloadArchive(screenshotCanvas);
    }
    button.textContent = 'Save results ???';

    saveButtonDiv.appendChild(button);
}


/*
* On change files update chart, create text field, summary table and textarea. On change select update only chart
* */
const onChange = (source) => {
    getParsedData().then(parsedData => {
        const select = document.getElementById('selectId');

        if (source === 'input') {
            if (select) {
                updateChart(select.value, parsedData);
            } else {
                updateChart(PARAMS.fpsMeasure, parsedData);
            }

            createTextField();
            createTable(parsedData);
            createTextAreaAndLabel();
            createSaveButton();
        }

        if (source === 'select') {
            updateChart(select.value, parsedData);
        }
    });
}