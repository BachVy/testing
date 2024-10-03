class Semaphore {
    constructor(value) {
        this.value = value;
        this.queue = [];
    }

    wait(callback) {
        if (this.value > 0) {
            this.value--;
            callback();
        } else {
            this.queue.push(callback);
        }
    }

    signal() {
        if (this.queue.length > 0) {
            const callback = this.queue.shift();
            callback();
        } else {
            this.value++;
        }
    }
}

const readerSemaphore = new Semaphore(1);
const writerSemaphore = new Semaphore(1);
let readCount = 0;
let writeCount = 0; 
let processes = [];

function addReader() {
    const startTime = document.getElementById('readerStartTime').value;
    const duration = document.getElementById('readerDuration').value;
    processes.push({ id: processId++, type: 'Reader', startTime: parseInt(startTime), duration: parseInt(duration) });
    updateProcessList();
}

function addWriter() {
    const startTime = document.getElementById('writerStartTime').value;
    const duration = document.getElementById('writerDuration').value;
    processes.push({ id: processId++, type: 'Writer', startTime: parseInt(startTime), duration: parseInt(duration) });
    updateProcessList();
}

function updateProcessList() {
    const processList = document.getElementById('processList');
    processList.innerHTML = '';
    processes.forEach((process, index) => {
        const row = `<tr>
                        <td>${index + 1}</td>
                        <td>${process.type} ${process.id}</td>
                        <td>${process.startTime}</td>
                        <td>${process.duration}</td>
                    </tr>`;
        processList.innerHTML += row;
    });
}

function startProcesses() {
    processes.sort((a, b) => a.startTime - b.startTime);
    processes.forEach((process) => {
        if (process.type === 'Reader') {
            setTimeout(() => startReader(process), process.startTime * 1000);
        } else {
            setTimeout(() => startWriter(process), process.startTime * 1000);
        }
    });
}

function startReader(process) {
    logMessage(`Reader ${process.id} is trying to read...`, 'waitingProcesses');
    readerSemaphore.wait(() => {
        if (readCount === 0) {
            writerSemaphore.wait(() => {});
        }
        readCount++;
        readerSemaphore.signal();

        logMessage(`Reader ${process.id} is reading...`, 'runningProcesses');
        removeMessage(`Reader ${process.id} is trying to read...`, 'waitingProcesses');
        setTimeout(() => {
            logMessage(`Reader ${process.id} finished reading.`, 'finishedProcesses');
            removeMessage(`Reader ${process.id} is reading...`, 'runningProcesses');

            readerSemaphore.wait(() => {
                readCount--;
                if (readCount === 0) {
                    writerSemaphore.signal();
                }
                readerSemaphore.signal();
            });
        }, process.duration * 1000);
    });
}

function startWriter(process) {
    logMessage(`Writer ${process.id} is trying to write...`, 'waitingProcesses');
    writerSemaphore.wait(() => {
       if (writeCount === 0) {
            readerSemaphore.wait(() => {});
        }
        writeCount++;
        logMessage(`Writer ${process.id} is writing...`, 'runningProcesses');
        removeMessage(`Writer ${process.id} is trying to write...`, 'waitingProcesses');
        setTimeout(() => {
            logMessage(`Writer ${process.id} finished writing.`, 'finishedProcesses');
            removeMessage(`Writer ${process.id} is writing...`, 'runningProcesses');

            writerSemaphore.signal();
            writeCount--;
            if (writeCount === 0) {
            readerSemaphore.signal(() => {});
        }
        }, process.duration * 1000);
    });
}

function logMessage(message, elementId) {
    const logElement = document.getElementById(elementId);
    logElement.innerHTML += `<div>${message}</div>`;
}

function removeMessage(message, elementId) {
    const logElement = document.getElementById(elementId);
    logElement.innerHTML = logElement.innerHTML.replace(`<div>${message}</div>`, '');
}

function clearProcesses() {
    document.getElementById('processList').innerHTML = '';
    document.getElementById('waitingProcesses').innerHTML = '';
    document.getElementById('runningProcesses').innerHTML = '';
    document.getElementById('finishedProcesses').innerHTML = '';
    processes = [];
}
