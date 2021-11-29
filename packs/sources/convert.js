let csvToJson = require('convert-csv-to-json');

let json = csvToJson
  .fieldDelimiter(',')
  .formatValueByType()
  .getJsonFromCsv("ancestral-traits.csv");
for(let i=0; i<json.length;i++){
    console.log(JSON.stringify(json[i]));
}