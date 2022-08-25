import * as fs from "fs";

function parseValueTuples(values) {
    let result = [];
    let position = 0;
    let inString = false;
    let inTuple = false;

    while (position < values.length) {
        let c = values[position];
        if (c === '(' && !inString) {
            inTuple = true;
            result.push("");
        } else if (c === ')' && !inString) {
            inTuple = false;
            if (values[position + 1] === ',') {
                position++;
            }
        } else if (c === '\'') {
            result[result.length - 1] += c;
            inString = !inString;
        } else if (c === ' ' && !inTuple && !inString) {
            // Ignore whitespace
        } else if (c === '\n' && !inTuple && !inString) {
            // Ignore whitespace
        } else {
            result[result.length - 1] += c;
        }
        position++;
    }
    return result;
}


function parseValuesToList(values) {
    // we need to manually parse the values because strings could contain commas
    let result = [];
    let position = 0;
    let inString = false;
    let currentString = '';

    while (position < values.length) {
        let c = values[position];
        if (c === ',' && !inString) {
            result.push(currentString);
            currentString = '';
        } else if (c === ' ' && !inString) {
            // do nothing
        } else if (c === '\'') {
            currentString += c;
            inString = !inString;
        } else {
            currentString += c;
        }
        position++;
    }
    result.push(currentString);
    return result;
}

function parseInsertStatements(source) {
    // Get all insert statements
    let position = 0;
    let inserts = [];
    while (source.indexOf('INSERT INTO', position) !== -1) {
        let inString = false;
        let start = source.indexOf('INSERT INTO', position);
        let pos = start;
        while (pos < source.length) {
            let c = source[pos];
            if (c === '\'') {
                inString = !inString;
            } else if (c === ';' && !inString) {
                break;
            }
            pos++;
        }
        inserts.push(source.substring(start, pos));
        position = pos;
    }
    return inserts;
}

function evaluateSQL(source) {
    let tables = {};

    let inserts = parseInsertStatements(source);
    for (let insert of inserts) {
        let tableName = insert.split(' ')[2].trim();
        tableName = tableName.substring(1, tableName.length - 1);
        let keys = insert.split('(')[1].split(')')[0].split(',').map(x => {
            x = x.trim();
            x = x.substring(1, x.length - 1);
            return x;
        });
        let values = insert.substring(insert.indexOf('VALUES') + 'VALUES'.length);
        let valueTuples = parseValueTuples(values);
        let valueParsedTuples = valueTuples.map(parseValuesToList);
        let rows = [];
        for (let valueTuple of valueParsedTuples) {
            let row = {};
            for (let i = 0; i < keys.length; i++) {
                row[keys[i]] = eval(valueTuple[i]);
            }
            rows.push(row);
        }
        if (!tables[tableName]) {
            tables[tableName] = [];
        }
        tables[tableName] = tables[tableName].concat(rows);
    }
    return tables;
}

// Get file from args
let file = process.argv[2];
if (!file) {
    console.log('Please provide a file to parse');
    process.exit(1);
}
let source = fs.readFileSync(file, 'utf8');
let tables = evaluateSQL(source);
let outputFile = file.substring(0, file.length - 3) + 'json';
// Check --format flag
let formatted = false;
for (const arg of process.argv) {
    if (arg.indexOf('--format') !== -1) {
        formatted = true;
    }
}
const output = JSON.stringify(tables, null, formatted ? 4 : null);
fs.writeFileSync(outputFile, output);
console.log(`Wrote ${outputFile} ${formatted ? '(formatted)' : ''}`);