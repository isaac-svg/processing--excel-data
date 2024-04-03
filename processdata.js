const fs = require("fs");
const readline = require("readline");
const path = require("path");

/**
 * @method processCsv
 */
function processCsv(fullpath) {
  const filePath = fullpath;
  const readStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  // "./01/2014-01-01.csv" -> "./sorted/2014-01-01.csv"
  const pathasArray = filePath.split("/");
  const outputPath =
    createNewDir(filePath) + "/" + pathasArray[pathasArray.length - 1];
  // console.log(outputPath, "-outputPath-");
  fs.open(outputPath, "a", (error, outputFile) => {
    if (error) {
      console.error("Error opening output file:", error);
      return;
    }
    const monoSiliconColums = [];
    let isFirstRead = true;
    let headersVisited = 0;
    let skipby2 = 0;
    let currentIndex, voltageIndex;
    let metadataCount = 0;
    rl.on("line", (line) => {
      // clean the first three lines which contains the file meta data
      if (metadataCount < 3) {
        metadataCount++;
        return;
      }
      if (isFirstRead) {
        const row = line.split(";");
        row.forEach((value, index) => {
          if (value.includes("(Mono Silicon)")) {
            monoSiliconColums.push(index);
          }
        });
        isFirstRead = false;
        // add header to new file
        fs.appendFile(outputFile, `dd.MM.yyyy HH:mm; Power\n`, (err) => {
          if (err) {
            console.error("Error appending to output file:", err);
            return;
          }
        });
      }
      headersVisited++;
      if (headersVisited <= 3) return;
      // we have the rows with the current and voltage
      // locate row with current and voltage on the forth line read

      if (headersVisited === 4) {
        // locate the index that has the curent and the voltage
        // console.log("forth");
        const row = line.split(";");
        for (
          let i = monoSiliconColums?.[0];
          i < monoSiliconColums[monoSiliconColums.length - 1];
          i++
        ) {
          if (row[i] === "DcMs.Amp[A]") {
            currentIndex = i;
            // console.log("current found at: ", i);
            // console.log("current is: ", row?.[i]);
          }
          if (row[i] === "DcMs.Vol[A]") {
            voltageIndex = i;
            // console.log("voltage found at: ", i);
            // console.log("voltage is: ", row?.[i]);
          }
        }
        return;
      }
      // skip the next two rows
      while (skipby2 < 4) {
        skipby2++;
        // console.log("I am here");
        return;
      }
      // console.log("I am now here");
      //  now lets computer the power the power

      const row = line.split(";");
      // console.log(row);
      const curent = row?.[currentIndex]?.split(",")?.join(".") ?? 0;
      // console.log("current has value: ", curent);
      const voltage = row?.[voltageIndex]?.split(",")?.join(".") ?? 0;
      // console.log("voltage has value: ", voltage);

      const power = Number(curent) * Number(voltage);
      const time = row?.[0];

      fs.appendFile(outputFile, `${time}; ${power}\n`, (err) => {
        if (err) {
          console.error("Error appending to output file:", err);
          return;
        }
      });
    });
    rl.on("close", () => {
      fs.close(outputFile, (err) => {
        if (err) {
          console.error("Error closing output file:", err);
          return;
        }
        console.log("Processing finished for: ", outputFile);
      });
    });
  });
}

function createNewDir(directory) {
  let oldDir = directory.split("/");

  oldDir.splice(0, 1, "./sorted");
  oldDir.splice(oldDir.length - 1, 1);
  const newDir = oldDir.join("/");
  // console.log(newDir, "newDir");
  fs.mkdirSync(newDir, { recursive: true, force: true }, (err) => {
    if (err) {
      console.log("Creating directory failed: ", err);
    }
  });
  return newDir;
}
/**
 *
 * @param {string} directoryPath relative or absolute paths to traverse
 * @description recursively walk through all the directories and sub-directories if you encounter a .csv file process it
 */
function traverseDirectories(directoryPath) {
  // Read the contents of the directory
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    // Iterate through each file or directory in the directory
    files.forEach((file) => {
      // Construct full path of the file or directory
      const fullPath = "./" + path.join(directoryPath, file);
      // console.log(fullPath, "fullPath");
      // Check if it's a directory
      fs.stat(fullPath, (err, stats) => {
        if (err) {
          console.error("Error getting file stats:", err);
          return;
        }

        if (stats.isDirectory()) {
          // If it's a directory, recursively traverse it
          traverseDirectories(fullPath);
        } else if (path.extname(file) === ".csv") {
          // If it's a CSV file, process it
          processCsv(fullPath);
        }
      });
    });
  });
}

// Start traversing from the parent directory
const parentDirectory = "./2014";
traverseDirectories(parentDirectory);
