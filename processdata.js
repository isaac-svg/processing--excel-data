const fs = require("fs");
const readline = require("readline");

// // File path of the CSV file
// const filePath = "./01/2014-01-01.csv";

// // Create a readable stream from the CSV file
// const fileStream = fs.createReadStream(filePath);

// // Create an interface to read the file line by line
// const rl = readline.createInterface({
//   input: fileStream,
//   crlfDelay: Infinity, // Recognize all instances of CR LF ('\r\n') as a single line break
// });

// // Event listener for reading each line of the file
// rl.on("line", (line) => {
//   // Process each line here
//   console.log(`Line from file: ${line}`);
// });

// // Event listener for end of file
// rl.on("close", () => {
//   console.log("End of file reached.");
// });

class ProcessCsv {
  constructor(filename) {
    this.filename = filename;
  }
  readFromCsv() {
    const filePath = this.filename;
    console.log("I am reached this is readFrom Csv talking");
    const readStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });
    let count = 0;
    // open the output file
    // console.log(filePath.split("/"));
    // "./01/2014-01-01.csv" -> "./sorted/2014-01-01.csv"
    const outputPath = "./sorted/" + filePath.trim().split("/")[2];

    fs.open(outputPath, "a+", (error, outputFile) => {
      if (error) {
        console.error("Error opening output file:", error);
        return;
      }
      let currentIndex = undefined,
        voltageIndex = undefined;
      let hasReadFirstRow = false;
      let skipCount = 0;
      if (count == 10) {
        fs.close(outputFile, (err) => {
          console.log(err);
        });
        readStream.end();
      }
      rl.on("line", (line) => {
        // console.log(line.split(","));
        const rowAsArray = line.split(",");
        currentIndex = rowAsArray.findIndex(
          (value) => value.split(";") === "DcMs.Amp[A]"
        );
        voltageIndex = rowAsArray.findIndex((value) => value === "DcMs.Vol[A]");
        // console.log(rowAsArray);
        // outputFile.close();

        if (currentIndex && voltageIndex && skipCount < 2) {
          skipCount++;
          return;
        }
        // return;
        if (!hasReadFirstRow) {
          fs.appendFile(outputFile, "dd.MM.yyyy HH:mm; Power\n", (err) => {
            if (err) {
              console.error("Error appending to output file:", err);
              count++;
              return;
            }
          });
          hasReadFirstRow = true;
        } else {
          console.log(currentIndex, "voltageIndex");
          console.log(voltageIndex, "voltageIndex");
          const current = rowAsArray?.[currentIndex];
          const voltage = rowAsArray?.[voltageIndex];
          console.log(current, " - I am current");
          console.log(voltage, " - I am voltage");

          const power = current * voltage;
          const time = rowAsArray[0];
          count++;
          fs.appendFile(outputFile, `${time}; ${power}\n`, (err) => {
            if (err) {
              console.error("Error appending to output file:", err);
              return;
            }
          });
        }
      });
      rl.on("close", () => {
        // outputFile.close();
        console.log("file closed");
        fs.close(outputFile, (err) => {
          if (err) {
            console.error("Error closing output file:", err);
            return;
          }
          console.log("File closed.");
        });
      });
    });
  }
  writeToCsv(filename) {}
  selectColumns(row) {}
}
const _process = new ProcessCsv("./01/2014-01-01.csv");
_process.readFromCsv();
