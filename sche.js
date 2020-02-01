const fileSelect = document.getElementById("fileSelect");
const fileElem = document.getElementById("fileElem");
const fileDownload = document.getElementById("fileDownload");
const nameSelect = document.getElementById("nameSelect");
const defaultNameOption = document.getElementById("defaultNameOption");

var fileSelected = false;
var inputCSV;

//object storing key infomation of the sche(without timetable)
var keyInfo = {
    year: 0,
    month: 0,
    nameListWithIndex: [] //[name,index]
};

//convert time to 2 digits
function to2Digits(str) {
    str = String(str);
    while (str.length < 2) {
        str = "0" + str;
    }
    return str;
}

//check if a block is on a workday (by finding "-")
function isWorkDay(block) {
    if (block.indexOf("-") == -1) {
        return false;
    } else {
        return true;
    }
}


//determinate the begin and the end time
function findBeginEnd(block) {
    var indexOfHyphen =block.indexOf("-");
    begin= block.substring(Math.max(indexOfHyphen - 5,0), indexOfHyphen) //for 1 digit of hr
    end = block.substring(indexOfHyphen +1,indexOfHyphen+6);
    var indexOfBeginColon = begin.indexOf(":");
    var indexOfEndColon = end.indexOf(":");
    var beginHr = begin.substring(Math.max(indexOfBeginColon - 2,0), indexOfBeginColon);
    var beginMin = begin.substring(indexOfBeginColon + 1, indexOfBeginColon + 3);
    var endHr = end.substring(Math.max(indexOfEndColon - 2,0), indexOfEndColon);
    var endMin = end.substring(indexOfEndColon + 1, indexOfEndColon + 3);
    return [beginHr, beginMin, endHr, endMin];
}

//col by col create Personal Schedule
function createPersonalSche() {
    var personalSche = [];
    const indexOfEventName = 4;
    const indexOfDate = 3; //row
    const startOfDate = 2; //column
    var indexOfRow = nameSelect.value;
    var length = inputCSV.data[indexOfDate].length; //the length of the timetable

    var year = keyInfo.year;
    var month = keyInfo.month;
    for (let i = startOfDate, date = 1; i < length; i++, date++) {
        let block = inputCSV.data[indexOfRow][i];
        if (isWorkDay(block)) {
            let EventName = inputCSV.data[indexOfEventName][i];
            let beginEnd = findBeginEnd(block); //[beginHr,beginMin,endHr,endMin]
            let beginHr = beginEnd[0];
            let beginMin = beginEnd[1];
            let endHr = beginEnd[2];
            let endMin = beginEnd[3];
            var beginTime = new Date(year, month - 1, date, beginHr, beginMin);
            var endTime = new Date(year, month - 1, date, endHr, endMin);
            if (endHr - beginHr < 0) {
                endTime = new Date(year, month - 1, date + 1, endHr, endMin);
            }
            let StartDate = beginTime.getFullYear() + "/" + (beginTime.getMonth() + 1) + "/" + beginTime.getDate();
            let StartTime = to2Digits(beginTime.getHours()) + ":" + to2Digits(beginTime.getMinutes());
            let EndDate = endTime.getFullYear() + "/" + (endTime.getMonth() + 1) + "/" + endTime.getDate();
            let EndTime = to2Digits(endTime.getHours()) + ":" + to2Digits(endTime.getMinutes());
            personalSche.push([EventName, StartDate, StartTime, EndDate, EndTime, "The Wall Live House"]);
        }
    }
    personalSche.unshift(["Subject", "Start Date", "Start Time", "End Date", "End Time", "Location"]);
    return personalSche;
    // console.log(personalSche);
}


//create options in select tags
function createSelectTagsOptions() {
    defaultNameOption.innerHTML = "選你的名字喔";
    for (let entry of keyInfo.nameListWithIndex) {
        newOption = document.createElement("option");
        newOption.text = entry[0];
        newOption.value = entry[1];
        newOption.className = "nameOption";
        nameSelect.appendChild(newOption);
    }
}

//delete option in select tags
function deleteSelectTagsOptions() {
    defaultNameOption.innerHTML = "先上傳檔案喔";
    do {
        options = document.getElementsByClassName("nameOption");
        for (let option of options) {
            option.remove();
        }
    } while (options.length);
}

//get year from filename
function getYear(filename) {
    try {
        let year = filename.split(" ")[1];
        if (year.length != 4) {
            throw new Error();
        }
        return Number(year);
    } catch (error) {
        throw new Error("File name has been changed");
    }
}

//get month from input csv
function getMonth(inputCSV) {
    try {
        let rawString = inputCSV.data[1][0];
        let month = rawString.split("月")[0];
        return Number(month);
    } catch (error) {
        throw new Error("Input CSV Invalid!");
    }
}

//get name list from input csv
function getNameList(inputCSV) {
    var nameList = [];
    var possiblyNameList = [];
    var nameListWithIndex = [];
    for (let row of inputCSV.data) {
        let possiblyName = row[0];
        possiblyNameList.push(possiblyName);
    }
    try {
        var indexOfName = possiblyNameList.indexOf("姓名");
        var indexOfAssist = possiblyNameList.indexOf("此線以下為代打  須經Jemp同意再找");
        var indexOfNumberOfTBs = possiblyNameList.indexOf("當日需上班人數");
        var regularList = possiblyNameList.slice(indexOfName + 1, indexOfAssist);
        var AssistList = possiblyNameList.slice(indexOfAssist + 1, indexOfNumberOfTBs);
        nameList.push(regularList, AssistList);
        nameList = nameList.flat();
        for (let name of nameList) {
            nameListWithIndex.push([name, possiblyNameList.indexOf(name)]);
        }
        return nameListWithIndex;
    } catch (error) {
        throw new Error("Sche format error");
    }
}

//convert CSV to sche
function CSVToSche(filename, inputCSV) {
    try {
        keyInfo.year = getYear(filename);
        keyInfo.month = getMonth(inputCSV);
        keyInfo.nameListWithIndex = getNameList(inputCSV);
        createSelectTagsOptions();
        fileSelected = true;
    } catch (error) {
        alert(error);
    }
}

//read the file and call CSV to sche
function fileHandler(file) {
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
        inputCSV = Papa.parse(reader.result);
        CSVToSche(file.name, inputCSV);
    });
    reader.readAsText(file);
}

var file;

//when the file select button is clicked, click the real file element
fileSelect.addEventListener("click", function (e) {
    deleteSelectTagsOptions();
    if (fileElem) {
        fileElem.click(e);
    }
    e.preventDefault(); // prevent navigation to "#"
}, false);

//get the file and pass it to file handler
fileElem.addEventListener("change", () => {
    file = fileElem.files[0];
    if (file) {
        fileHandler(file);
    }
}, false);


//click download button
fileDownload.addEventListener("click", (e) => {
    try {
        if (!fileSelected) {
            throw new Error("Please select a file");
        }
        if (nameSelect.value == "-1") {
            throw new Error("Please select your name");
        }
        personalSche = createPersonalSche();
        outputCSV = Papa.unparse(personalSche);

        var name = nameSelect.options[nameSelect.selectedIndex].text;
        var filename = `${keyInfo.year} ${keyInfo.month}月The Wall班表-${name}.csv`;
        var outputFile = new File([outputCSV], filename, {
            type: "text/plain;charset=utf-8"
        });
        var outputURL = URL.createObjectURL(outputFile);

        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display:none";
        a.href = outputURL;
        a.download = filename;
        a.click();
    } catch (error) {
        alert(error);
    }

    e.preventDefault();
}, false);