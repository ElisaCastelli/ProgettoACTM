// IMPORT

import { type, allNotes1D, chordBuilder } from './Resources/chordBuilder.js';
import { tensionChange, start } from './Resources/tensionAnimation.js';
import { evaluateTension, Chord, ChordPlus, Key } from './Resources/harmonicAnalysis.js';
import { uploadFile, downloadFile } from './Resources/readFile.js';
import { matrixConstructor, matrixToString, emptyMatrix, getIndexSelectedCell, fillMatrix, emptyCell, changeSelection, findSameNotes, setSelectableCell, getIdCell, findRootNoteByColumn, unselectCell, getAllSelectedId, getIndexCellById, getSelectedByColumn, getCellColumnByIndex, addRootCell, findNoteByNameAndColumn, getSelectableByColumn, checkSelectableByColumn, findCellsByColumn, findUnselectedCell, getCellsToMakeSelectable, rootAfterChordType, printChord, getSelectedByColumnExceptRoot, getSelectedAndSelectable, findNoteByMatrixIndex, getColumnNotes } from './Resources/matrix.js';

const fileInput = document.getElementById('file-input');

// MODEL
let numOctaves = 3;
let numOctavesMin = 2;
let maxColumns = 20;
let cellsNumber = numOctaves * 12 * maxColumns;
let columnPlayed = maxColumns - 1;
let timeInterval = 0;
let finalProgression = new Array(maxColumns);
let analysisResults = new Array();
let modelButton = false;
let firstPlay = true;


// creazione synthetizer
let muted = false;
let minVolume = -8;
let MaxVolume = -4;
let Volume = (MaxVolume + minVolume) / 2;

let sampler = new Tone.Sampler({
    "C2": "./piano/C2.mp3",
    "C#2": "./piano/Cs2.mp3",
    "D2": "./piano/D2.mp3",
    "D#2": "./piano/Ds2.mp3",
    "E2": "./piano/E2.mp3",
    "F2": "./piano/F2.mp3",
    "F#2": "./piano/Fs2.mp3",
    "G2": "./piano/G2.mp3",
    "G#2": "./piano/Gs2.mp3",
    "A2": "./piano/A2.mp3",
    "A#2": "./piano/As2.mp3",
    "B2": "./piano/B2.mp3",
    "C3": "./piano/C3.mp3",
    "C#3": "./piano/Cs3.mp3",
    "D3": "./piano/D3.mp3",
    "D#3": "./piano/Ds3.mp3",
    "E3": "./piano/E3.mp3",
    "F3": "./piano/F3.mp3",
    "F#3": "./piano/Fs3.mp3",
    "G3": "./piano/G3.mp3",
    "G#3": "./piano/Gs3.mp3",
    "A3": "./piano/A3.mp3",
    "A#3": "./piano/As3.mp3",
    "B3": "./piano/B3.mp3",
    "C4": "./piano/C4.mp3",
    "C#4": "./piano/Cs4.mp3",
    "D4": "./piano/D4.mp3",
    "D#4": "./piano/Ds4.mp3",
    "E4": "./piano/E4.mp3",
    "F4": "./piano/F4.mp3",
    "F#4": "./piano/Fs4.mp3",
    "G4": "./piano/G4.mp3",
    "G#4": "./piano/Gs4.mp3",
    "A4": "./piano/A4.mp3",
    "A#4": "./piano/As4.mp3",
    "B4": "./piano/B4.mp3",
}).set({
    "volume": Volume,
}).toMaster();

const key_color = [{
        pitch: "C",
        color: "white",
    },
    {
        pitch: "C#",
        color: "black"
    },
    {
        pitch: "D",
        color: "white"
    },
    {
        pitch: "D#",
        color: "black"
    },
    {
        pitch: "E",
        color: "white"
    },
    {
        pitch: "F",
        color: "white"
    },
    {
        pitch: "F#",
        color: "black"
    },
    {
        pitch: "G",
        color: "white"
    },
    {
        pitch: "G#",
        color: "black",
    },
    {
        pitch: "A",
        color: "white"
    },
    {
        pitch: "A#",
        color: "black"
    },
    {
        pitch: "B",
        color: "white"
    }
];

// costruttore Note
function Note(octave, name, column, row, id) {
    this.octave = octave;
    this.name = name;
    this.column = column;
    this.row = row;
    this.id = id;
    let selected = false;
    let selectable = false;
    let root = false;
}

/** Function to fill the finalProgression array with the one read from a file */
export function fillFinalProgression(progressionRead) {
    finalProgression = new Array(maxColumns);
    progressionRead = progressionRead.substring(1, progressionRead.length);
    let indexSpace = 0;
    let indexProgression = 0;
    while (progressionRead != "") {
        indexSpace = progressionRead.indexOf(" ");
        let chordString = progressionRead.substring(0, indexSpace);
        let type = "";
        let note = chordString[0];
        let secondChar = chordString[1];
        if (secondChar == "#") {
            note = note + secondChar;
        }
        type = chordString.substring(note.length, chordString.length);
        let chord = new Chord(note, type);
        finalProgression[indexProgression] = chord;
        progressionRead = progressionRead.slice(indexSpace + 1, progressionRead.length);
        indexProgression++;
    }
    return finalProgression;
}

/** Function to select the root of a chord when upload a file  */
export function selectRoot() {
    let maxColumnIndex = finalProgression.findIndex(x => typeof x == 'undefined');
    for (let index = 0; index < maxColumnIndex; index++) {
        let chord = finalProgression[index];
        let note = chord.note;
        let type = chord.type;
        let columnIndex = maxColumns - 1 - index;
        let indexMatrix = getIndexSelectedCell(note, columnIndex);
        if (indexMatrix != null) {
            let idRoot = getIdCell(indexMatrix);
            addRootCell(indexMatrix);
            let col = getCellColumnByIndex(indexMatrix);
            let select = document.getElementById("select" + col);
            select.value = type;
            let button = document.getElementById("b" + idRoot);
            button.textContent = note+type;
            let selectableCells = getCellsToMakeSelectable(columnIndex, idRoot);
            if (selectableCells.length > 0) {
                selectableCells.forEach(cell => {
                    setSelectableCell(cellsNumber - cell.id);
                });
            }
        }
    }
}

/** Function to unselect all the cells of the table and update the variables of the matrix elements Note */
export function unselectMatrix(lengthChordArray) {
    let index = 0;
    if (lengthChordArray >= 0) {
        for (let indexColumn = maxColumns - 1; indexColumn >= lengthChordArray; indexColumn--) {
            for (let indexRow = (numOctaves * 12) - 1; indexRow >= 0; indexRow--) {
                emptyCell(index);
                let idCell = getIdCell(index);
                let cell = document.getElementById(idCell);
                cell.classList.remove("disabled");
                cell.classList.remove("selected_background");
                cell.classList.remove("light_background");
                index++;
            }
            resetSelect(indexColumn);
        }
    } else {
        // se sono selezionate note singole
    }
}



/** Function to disable click on a certain given column */
function unclickableColumn(numCol) {
    let columnCell = findUnselectedCell(numCol);
    for (let index = 0; index < columnCell.length; index++) {
        let idCell = columnCell[index].id;
        let cell = document.getElementById(idCell);
        cell.classList.add("disabled");
    }
}

/** Function to allow click on a certain given column */
function clickableColumn(numCol) {
    let columnCell = findCellsByColumn(numCol);
    for (let index = 0; index < columnCell.length; index++) {
        let idCell = columnCell[index].id;
        let cell = document.getElementById(idCell);
        cell.classList.remove("disabled");
        let indexCell = getIndexCellById(columnCell[index].id);
        unselectCell(indexCell);
    }
}

/** Function to clear all notes selected or selectable from a specific column */
function clearColumn(columnNumber) {
    let notesToClear = getSelectedAndSelectable(columnNumber);
    for (let index = 0; index < notesToClear.length; index++) {
        notesToClear[index].selectable = false;
        notesToClear[index].selected = false;
        notesToClear[index].root = false;
        let idCell = notesToClear[index].id;
        let cell = document.getElementById(idCell);
        let button = document.getElementById("b" + idCell);
        button.textContent = "";
        cell.classList.remove("light_background");
        cell.classList.remove("selected_background");
    }
}

function clearRootText(columnNumber) {
    let root = findRootNoteByColumn(columnNumber);
    let idCell = root.id;
    let button = document.getElementById("b" + idCell);
    button.textContent = "";
}

/** Function to remove the visual content associated to the selectable cells of a specific column of the table  */
function removeSelectable(columnNumber) {
    let selectableNotes = getSelectableByColumn(columnNumber);
    for (let index = 0; index < selectableNotes.length; index++) {
        selectableNotes[index].selectable = false;
        let idCell = selectableNotes[index].id;
        let cell = document.getElementById(idCell);
        cell.classList.remove("light_background");
        cell.classList.add('disabled')
    }
}

function removeSelectedExceptRoot(columnNumber) {
    let selectedNotes = getSelectedByColumnExceptRoot(columnNumber);
    for (let index = 0; index < selectedNotes.length; index++) {
        selectedNotes[index].selected = false;
        let idCell = selectedNotes[index].id;
        let cell = document.getElementById(idCell);
        cell.classList.remove("selected_background");
        cell.classList.add('disabled')
    }
}

/** Function to update the visual content of the table based on the update matrixTable */
export function printSelected() {
    let selectedCells = getAllSelectedId();
    selectedCells.forEach(id => {
        let cell = document.getElementById(id);
        cell.classList.add("selected_background");
    });
}

/** Function to remove the visual content associated to the selectable cells of a specific column of the table  */
export function printSelectable(noteArray, columnNumber) {
    for (let index = 1; index < noteArray.length; index++) {
        let notesToPrint = findNoteByNameAndColumn(noteArray[index], columnNumber);
        for (let i = 0; i < notesToPrint.length; i++) {
            let idCell = notesToPrint[i].id;
            let cell = document.getElementById(idCell);
            let indexCell = getIndexCellById(idCell);
            setSelectableCell(indexCell);
            cell.classList.remove("disabled");
            cell.classList.add("light_background");
        }
    }
}

/** Function called after selecting the tonic note and the type of chord to compute which are the other notes needed to complete the chord we want */
function chordTypeSelected(columnNumber, chordType) {
    let noteSelected = findRootNoteByColumn(columnNumber);
    if (noteSelected != null) {
        let noteName = noteSelected.name;
        let noteNumber = allNotes1D.indexOf(noteName);
        let shape = type[type.findIndex(x => x.name == chordType)].shape;
        let noteArray = chordBuilder(noteNumber, shape);
        printSelectable(noteArray, columnNumber);
        let chord = new Chord(noteName, chordType);
        finalProgression[Math.abs(maxColumns - columnNumber - 1)] = chord;
        // write name of the chord in the root
        let idCell = noteSelected.id;
        let button = document.getElementById("b" + idCell);
        button.textContent = noteName + chordType;
    }
}

function autoFill(columnNumber) {
    let root = findRootNoteByColumn(columnNumber);
    let rootName = root.name;
    let rootNumber = allNotes1D.indexOf(rootName);
    let select = document.getElementById("select" + (columnNumber));
    let chordType = select.value;
    let shape = type[type.findIndex(x => x.name == chordType)].shape;
    let noteArray = chordBuilder(rootNumber, shape);
    let octaveNoteSelected = root.octave;
    removeSelectable(columnNumber);
    removeSelectedExceptRoot(columnNumber);
    printChord(noteArray, octaveNoteSelected, columnNumber);
}


// CONTROLLER

/** Function to move the table scroll in its starting position */
function tableBackscroll(position) {
    const table = document.getElementById("table-scroll");
    table.scrollLeft = position;
}

/** Function to move the table scroll */
function scroll() {
    const bar = document.getElementById("scrollingBar");
    const pianoContainer = document.getElementById("output_block");
    const tableScroll = document.getElementById("table-scroll");
    let speed = 1;
    let direction = 1;
    let barLeftPos = bar.offsetLeft,
        barRightPos = barLeftPos + bar.offsetWidth;
    let containerWidth = pianoContainer.offsetWidth;
    if (barRightPos < containerWidth / 2) {
        bar.style.left = (barLeftPos + speed * direction) + 'px';
    } else if (tableScroll.scrollWidth - tableScroll.scrollLeft > containerWidth) {
        tableScroll.scrollLeft += speed * direction;
    } else if (barRightPos < tableScroll.offsetWidth) {
        bar.style.left = (barLeftPos + speed * direction) + 'px';
    }
}

/** function to add a tone from the selectable options. Updates both the matrix and the visuals*/
function addTone(cell, columnNumber, cellIndex) {
    changeSelection(cellIndex);
    cell.classList.toggle("disabled");
    cell.classList.toggle("selected_background");
    let sameNotes = findSameNotes(columnNumber, cellIndex);
    for (let i = 0; i < sameNotes.length; i++) {
        if (sameNotes[i].selectable == true) {
            sameNotes[i].selectable = false;
        } else {
            sameNotes[i].selectable = true;
        }
        let sameNoteid = sameNotes[i].id;
        let sameNoteCell = document.getElementById(sameNoteid);
        sameNoteCell.classList.toggle("disabled");
        sameNoteCell.classList.toggle("light_background");
    }
}

/** Funtion that adds or removes notes from the pianoroll*/
function addNote(cell, idCell, columnNumber) {
    columnNumber = (maxColumns - 1) - columnNumber;
    let matrixIndex = numOctaves * 12 * maxColumns - idCell;
    let note = findNoteByMatrixIndex(matrixIndex);
    let findRoot = findRootNoteByColumn(columnNumber);
    let rightColumn = maxColumns - 1 - finalProgression.findIndex(x => typeof x == 'undefined');
    
    // condition to fill the columns in order
    if ( findRootNoteByColumn(columnNumber) != undefined || columnNumber == (maxColumns-1) || columnNumber == rightColumn){

        // autofill the previous column in fundamental position if there are still selectable notes
        if (columnNumber != (maxColumns - 1)) {
            for (let columnIndex = maxColumns-1 ; columnIndex >= rightColumn ; columnIndex--) {
                if (checkSelectableByColumn(columnIndex) != undefined && columnNumber != columnIndex) {
                    autoFill(columnIndex);
                }
            }
        }

        // selecting the first note ( the root of the chord)
        if (findRoot == undefined) {
            addRoot(cell, matrixIndex, columnNumber);
        }
        // removing the root
        else if (findRoot.id == idCell) {
            removeAll(columnNumber);
        }
        // adding or removing chord tones
        if (note.selected && note.root != true) {
            addTone(cell, columnNumber, matrixIndex);
        } else if (note.selectable) {
            addTone(cell, columnNumber, matrixIndex);
        }

    } else {
        // highlight the right column
        let notes = getColumnNotes(rightColumn);
        alert("please fill the highlighted column first");
        for (let index = 0; index < notes.length; index++) {
            let idCell = notes[index].id;
            let cell = document.getElementById(idCell);
            cell.classList.add("highlighted_column");
            setTimeout( function() { cell.classList.remove("highlighted_column")} , 1000);
        }
    }
}

/** function that adds the root of a chord on the pianoroll */
function addRoot(cell, matrixIndex, columnNumber) {
    cell.classList.toggle("selected_background");
    addRootCell(matrixIndex);
    unclickableColumn(getCellColumnByIndex(matrixIndex));
    let select = document.getElementById("select" + columnNumber);
    if (select.value != 'default') {
        rootAfterChordType(matrixIndex, columnNumber);
        let note = findNoteByMatrixIndex(matrixIndex);
        let noteName = note.name;
        let select = document.getElementById("select" + columnNumber);
        let chordType = select.value;
        let chord = new Chord(noteName, chordType);
        finalProgression[Math.abs(maxColumns - columnNumber - 1)] = chord;
        // write chord name in the root note
        let idCell = note.id;
        let button = document.getElementById("b" + idCell);
        button.textContent = noteName + chordType;
    }
}

/** Function to remove everything from a column */
function removeAll(columnNumber) {
    clearColumn(columnNumber);
    clickableColumn(columnNumber);
    resetSelect(columnNumber);
    finalProgression[maxColumns - 1 - columnNumber] = undefined;
}

/** Function to reset select value */
function resetSelect(columnNumber) {
    let select = document.getElementById("select" + columnNumber);
    select.value = "default";
}

/** Function to alternate the recalling of scroll() and play() functions */
function playAndScroll() {
    scroll();
    if (timeInterval % 2700 == 0) {
        if ((maxColumns - columnPlayed - 1) < finalProgression.length) {
            play();
            tensionChange(analysisResults[Math.abs(columnPlayed + 2 - maxColumns)].tension);
        } else {
            const stopButton = document.getElementById("stopButton");
            stopButton.onclick();
            timeInterval -= 25;
        }
    }
    timeInterval += 25;
}

/** Function to play the chord using a Sampler */
function play() {
    const chordPlayed = document.getElementById("chordPlayed");
    var degree = 'Degree: ' + analysisResults[maxColumns - 1 - columnPlayed].degree;
    const eventContainer = document.getElementById('eventContainer');
    var substitution = "";
    const progressionInfo = document.getElementById('progressionInfo');
    const subInfo = document.getElementById("substitutionInfo");
    let noteSelected = getSelectedByColumn(columnPlayed);
    let notesArray = new Array();
    if (noteSelected != null) {
        for (let index = 0; index < noteSelected.length; index++) {
            let noteName = noteSelected[index].name;
            let octave = noteSelected[index].octave;
            notesArray.push(noteName + octave);
        }
        if(analysisResults[maxColumns - 1 - columnPlayed].substitution.length != 0 ){
            substitution = 'Substitution: \n'+analysisResults[maxColumns - 1 - columnPlayed].substitution.toString();
            subInfo.style.visibility='visible';
            subInfo.textContent= substitution;
        }else{
            subInfo.style.visibility='hidden';
            subInfo.textContent= "";
        }
        if(analysisResults[maxColumns - 1 - columnPlayed].event!=""){
            eventContainer.style.visibility='visible';
            var text = analysisResults[maxColumns - 1 - columnPlayed].event;
            eventContainer.textContent=text;
        }else{
            eventContainer.textContent="";
            eventContainer.style.visibility='hidden';
        }
        if (analysisResults[maxColumns - 1 - columnPlayed].curr_pattern != "") {
            progressionInfo.style.visibility = 'visible';
            progressionInfo.textContent = analysisResults[maxColumns - 1 - columnPlayed].curr_pattern;
        } else {
            progressionInfo.style.visibility = 'hidden';
            progressionInfo.textContent = "";
        }
        chordPlayed.textContent = degree;
        if (notesArray.length == 3) {
            sampler.triggerAttackRelease([notesArray[0], notesArray[1], notesArray[2]], 2);
        } else if (notesArray.length == 4) {
            sampler.triggerAttackRelease([notesArray[0], notesArray[1], notesArray[2], notesArray[3]], 2);
        }
    }
    notesArray = [];
    columnPlayed--;
    sampler = new Tone.Sampler({
        "C2": "./piano/C2.mp3",
        "C#2": "./piano/Cs2.mp3",
        "D2": "./piano/D2.mp3",
        "D#2": "./piano/Ds2.mp3",
        "E2": "./piano/E2.mp3",
        "F2": "./piano/F2.mp3",
        "F#2": "./piano/Fs2.mp3",
        "G2": "./piano/G2.mp3",
        "G#2": "./piano/Gs2.mp3",
        "A2": "./piano/A2.mp3",
        "A#2": "./piano/As2.mp3",
        "B2": "./piano/B2.mp3",
        "C3": "./piano/C3.mp3",
        "C#3": "./piano/Cs3.mp3",
        "D3": "./piano/D3.mp3",
        "D#3": "./piano/Ds3.mp3",
        "E3": "./piano/E3.mp3",
        "F3": "./piano/F3.mp3",
        "F#3": "./piano/Fs3.mp3",
        "G3": "./piano/G3.mp3",
        "G#3": "./piano/Gs3.mp3",
        "A3": "./piano/A3.mp3",
        "A#3": "./piano/As3.mp3",
        "B3": "./piano/B3.mp3",
        "C4": "./piano/C4.mp3",
        "C#4": "./piano/Cs4.mp3",
        "D4": "./piano/D4.mp3",
        "D#4": "./piano/Ds4.mp3",
        "E4": "./piano/E4.mp3",
        "F4": "./piano/F4.mp3",
        "F#4": "./piano/Fs4.mp3",
        "G4": "./piano/G4.mp3",
        "G#4": "./piano/Gs4.mp3",
        "A4": "./piano/A4.mp3",
        "A#4": "./piano/As4.mp3",
        "B4": "./piano/B4.mp3",
    }).set({
        "volume": Volume,
    }).toMaster();
}

// VIEW

/** Function called the first time the page is loaded to add the left fixed column of the table that shows the corresponding notes to each row*/
function createFixedColumn(scaleNumber, noteNumber) {
    const fixedColumn = document.createElement("th");
    fixedColumn.classList.add("leftstop");
    let color = key_color[noteNumber].color;
    fixedColumn.classList.add(color);
    let label = key_color[noteNumber].pitch + " " + scaleNumber;
    let divLabel = document.createElement("div");
    var t = document.createTextNode(label);
    divLabel.appendChild(t);
    divLabel.classList.add("label");
    fixedColumn.append(divLabel);
    return fixedColumn;
}

/** Function called the first time the page is loaded to add the table rows*/
function createRow(scaleNumber, noteNumber) {
    const row = document.createElement("tr");
    let rowNumber = numOctaves * 12 - ((scaleNumber - numOctavesMin) * 12 + noteNumber) - 1;
    // per ogni riga aggiungo la prima colonna che rimarrà fissa e poi tutte le altre
    let fixedColumn = createFixedColumn(scaleNumber, noteNumber);
    row.appendChild(fixedColumn);
    for (let columnNumber = 0; columnNumber < maxColumns; columnNumber++) {
        const cell = document.createElement("td");
        cell.classList.add("white");
        const button = document.createElement("button");
        button.classList.add("cellButton");
        let idCell = cellsNumber - rowNumber - (columnNumber * numOctaves * 12);
        button.onclick = function() { addNote(cell, idCell, columnNumber); };
        cell.appendChild(button);
        button.setAttribute("id", "b" + idCell);
        cell.setAttribute("id", idCell);
        row.appendChild(cell);
        // alternanza sfondi per righe piano roll (nero e bianco)
        if (noteNumber == 1 || noteNumber == 3 || noteNumber == 6 || noteNumber == 8 || noteNumber == 10) {
            cell.classList.add('dark_background');
        } else {
            cell.classList.add('white_background');
        }
    }
    return row;
}

/** Function called the first time the page is loaded to add the first fixed table row with the select elements*/
function createHeader() {
    const table_head = document.createElement("thead");
    const row = document.createElement("tr");
    for (let columnNumber = maxColumns; columnNumber >= 0; columnNumber--) {
        const cell = document.createElement("th");
        cell.className = "topstop";
        // creazione prima riga di chord type
        if (columnNumber != maxColumns) {
            const select = document.createElement("select");
            select.setAttribute("id", "select" + columnNumber);
            const option0 = document.createElement("option");
            option0.text = "Chord type";
            option0.setAttribute("value", "default");
            const option1 = document.createElement("option");
            option1.text = "Major";
            option1.setAttribute("value", "");
            const option2 = document.createElement("option");
            option2.text = "Minor";
            option2.setAttribute("value", "min");
            const option3 = document.createElement("option");
            option3.text = "Diminished";
            option3.setAttribute("value", "dim");
            const option4 = document.createElement("option");
            option4.text = "Maj7";
            option4.setAttribute("value", "maj7");
            const option5 = document.createElement("option");
            option5.text = "Min7";
            option5.setAttribute("value", "min7");
            const option6 = document.createElement("option");
            option6.text = "7";
            option6.setAttribute("value", "7");
            const option7 = document.createElement("option");
            option7.text = "Half Diminished";
            option7.setAttribute("value", "halfdim");
            const option8 = document.createElement("option");
            option8.text = "Diminished 7";
            option8.setAttribute("value", "dim7");

            select.appendChild(option0);
            select.appendChild(option1);
            select.appendChild(option2);
            select.appendChild(option3);
            select.appendChild(option4);
            select.appendChild(option5);
            select.appendChild(option6);
            select.appendChild(option7);
            select.addEventListener("change", function(event) {
                let chordType = this.value;
                removeSelectable(columnNumber);
                removeSelectedExceptRoot(columnNumber);
                if (chordType == "default"){
                    clearRootText(columnNumber);
                } 
                if (chordType != "default") {
                    chordTypeSelected(columnNumber, chordType);
                }
            }, false);
            cell.appendChild(select);

        }
        row.appendChild(cell);
    }
    table_head.appendChild(row);
    return table_head;
}

/** Function called the first time the page is loaded to add the table element */
function createTable() {
    const main_table = document.createElement("table");
    let table_head = createHeader();
    const table_body = document.createElement("tbody");
    //per ogni nota creo una riga della tabella e la carico nella tabella
    for (let rowNumber = numOctaves * key_color.length - 1; rowNumber >= 0; rowNumber--) {
        let scaleNumber = Math.floor(rowNumber / key_color.length);
        let noteNumber = rowNumber - (key_color.length * scaleNumber);
        scaleNumber = scaleNumber + numOctavesMin;
        let row = createRow(scaleNumber, noteNumber);
        table_body.appendChild(row);
    }
    main_table.appendChild(table_head);
    main_table.appendChild(table_body);
    return main_table;
}

/** Function called the first time the page is loaded to add the div element that contains the table */
function createPianoRoll() {
    const pianoRollTable = document.createElement("div");
    pianoRollTable.classList.add("table-scroll");
    pianoRollTable.classList.add("mainTable");
    pianoRollTable.setAttribute("id", "table-scroll");
    const table_wrap = document.createElement("div");
    table_wrap.classList.add("table-wrap");
    let main_table = createTable();
    table_wrap.appendChild(main_table);
    pianoRollTable.appendChild(table_wrap);
    return pianoRollTable;
}

/** Function called the first time the page is loaded to add the div element that corresponds to the scroll bar */
function createBar() {
    const bar = document.createElement("div");
    bar.setAttribute("id", "scrollingBar");
    bar.classList.add("scrollingBar");
    return bar;
}


/** Onclick functions */

/** onclick associated with the div that contains the title to reload the page */
title_container.onclick = function() {
    window.location.reload(false);
}

/** onclick associated with the resetButton to empty the content of the table and reset all the global variables */
resetButton.onclick = function() {
    if (!modelButton) {
        let lengthChordArray = 0;
        if (finalProgression.length == maxColumns) {
            lengthChordArray = finalProgression.findIndex(x => typeof x == 'undefined');
        } else {
            lengthChordArray = finalProgression.length;
        }
        const chordPlayed = document.getElementById("chordPlayed");
        chordPlayed.textContent = "";
        chordPlayed.style.visibility = "hidden";
        for (let indexColumn = maxColumns - 1; indexColumn > ((maxColumns - 1) - lengthChordArray); indexColumn--) {
            clearRootText(indexColumn);
        }
        unselectMatrix(lengthChordArray);
        modelButton = false;
        timeInterval = 0;
        columnPlayed = maxColumns - 1;
        finalProgression = new Array(maxColumns);
        analysisResults = new Array();
        firstPlay = true;
        tableBackscroll(0);
        const bar = document.getElementById("scrollingBar");
        bar.style.left = '93px';
        const progressionInfo = document.getElementById('progressionInfo');
        progressionInfo.textContent="";
        progressionInfo.style.visibility='hidden';
        const eventContainer = document.getElementById('eventContainer');
        eventContainer.textContent="";
        eventContainer.style.visibility='hidden';
        tensionChange(0);
    }
}

/** onclick associated with the uploadButton to read a file */
uploadButton.onchange = function() {
    uploadFile(fileInput.files[0], maxColumns);
}

/** onclick associated with the downloadButton to download a file that contains the chord progression you put inside the pianoroll */
downloadButton.onclick = function() {
    if (!emptyMatrix()) {
        const nameInput = document.getElementById("fileName");
        let fileName = nameInput.value;
        if(fileName!="" && fileName!="Name required!"){
            fileName = fileName +".txt";
            let text = matrixToString(finalProgression, maxColumns, cellsNumber);
            downloadFile(fileName, text);
        }else{
            nameInput.placeholder="Name required!";
        }
    }
}


muteButton.onclick = function() {
    muted = !muted;
    Tone.Master.mute = muted;
}

volumeUpButton.onclick = function() {
    if ((Volume + 1) <= MaxVolume) {
        Volume++;
        document.getElementById("volumeDownButton").classList.remove("disable");
    } else {
        document.getElementById("volumeUpButton").classList.add("disable");
        document.getElementById("volumeUpButton").classList.add("maxiVolume");
    }
}

volumeDownButton.onclick = function() {
    if ((Volume - 1) >= minVolume) {
        Volume--;
        document.getElementById("volumeUpButton").classList.remove("disable");
    } else {
        document.getElementById("volumeDownButton").classList.add("disable");
    }
}

// cancella tutto il contenuto del piano roll
/*function refresh() {
    matrixTable = [];
    timeInterval = 0;
    tableBackscroll(0);
    columnPlayed = maxColumns - 1;
    finalProgression = [];
    analysisResults = [];
    bar.style.left = '93px';
    const pianoContainer = document.getElementById("output_block");
    while (pianoContainer.lastChild) {
        pianoContainer.removeChild(pianoContainer.lastChild);
    }
}*/

/** Function called at the first load of the page to add al the graphic elements */
function firstRender() {
    start;
    tensionChange(0);
    const pianoContainer = document.getElementById("output_block");
    const playButton = document.getElementById("playButton");
    const divChordPlayed = document.getElementById("chordPlayed");
    let pianoRollTable = createPianoRoll();
    pianoContainer.appendChild(pianoRollTable);
    let bar = createBar();
    let lastBarPosition = bar.style.left;
    let lastTableScrollPosition;
    let scrollInterval;
    pianoContainer.appendChild(bar);
    playButton.onclick = function() {
        if (!modelButton && !emptyMatrix()) {
            const tableScroll = document.getElementById("table-scroll");
            modelButton = true;
            divChordPlayed.style.visibility = 'visible';
            let maxIndex = 0;
            if (firstPlay) {
                lastBarPosition = '93px';
                lastTableScrollPosition = 0;
            }
            tableScroll.style.overflowX = 'hidden';
            if (finalProgression.length == maxColumns) {
                maxIndex = finalProgression.findIndex(x => typeof x == 'undefined');
            } else {
                maxIndex = finalProgression.length;
            }
            bar.style.left = lastBarPosition;
            tableBackscroll(lastTableScrollPosition);
            finalProgression = finalProgression.slice(0, maxIndex);
            analysisResults = evaluateTension(finalProgression);
            scrollInterval = setInterval(playAndScroll, 25);
            stopButton.onclick = function() {
                lastBarPosition = bar.style.left;
                lastTableScrollPosition = tableScroll.style.scrollLeft;
                modelButton = false;
                firstPlay = false;
                tableScroll.style.overflowX = 'auto';
                clearInterval(scrollInterval);
                tensionChange(0);
            }
        };
    }

    rewindButton.onclick = function() {
            const tableScroll = document.getElementById("table-scroll");
            tableBackscroll(0);
            tableScroll.style.overflowX = 'auto';
            bar.style.left = '93px';
            const chordPlayed = document.getElementById("chordPlayed");
            chordPlayed.textContent = "";
            chordPlayed.style.visibility = "hidden";
            modelButton = false;
            columnPlayed = maxColumns - 1;
            timeInterval = 0;
            clearInterval(scrollInterval);
            tensionChange(0);
            firstPlay = true;
        }
        // no parametro perchè sovrascriviamo numOttave, 1 singola variabile globale
    matrixConstructor(cellsNumber, maxColumns, numOctaves, numOctavesMin, key_color);

    generaReadme();
}

firstRender();

// spacebar event
document.body.onkeyup = function(e) {
    if (e.keyCode == 32) {
        // eventuale codice spacebar
    }
}

// on click readme, add infos about the site
// absent the content of the div
readmeButton.onclick = generaReadme();

GitHubIcon.onclick = function() {
    window.open("https://github.com/ElisaCastelli/HarmonicTensionVisualizer.git");
}

function generaReadme() {
    const contenitore = document.getElementById("readMeSection");
    // (contenitore == null)
    {
        const testo = "Harmonic Tension Visualizer.<br> The goal of our project is to analyze a chord sequence, given by the user through an intuitive piano-roll interface, in order to determine the trend of the harmonic tension. Following different criteria, estabilished by us and based on music theory, we assign to each chord a certain level of tension, influenced by:" +
            "<br>-the chord 's composition,<br>-well-known progression patterns,<br>-the harmonic context.";
        const readMeSection = document.createElement("div");
        const link = document.createElement("a");
        link.setAttribute("name", "readMe");
        readMeSection.appendChild(link);
        readMeSection.classList.add("readStyle");
        readMeSection.innerHTML += testo;
        readMeSection.setAttribute("id", "readMeSection");
        const pagina = document.getElementById("pagina");
        pagina.appendChild(readMeSection);
    } //else {
    // const pagina = document.getElementById("readMeSection");
    // pagina.remove();
    //}
}