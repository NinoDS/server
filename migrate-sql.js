import * as fs from "fs";
import chalk from 'chalk';

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

function renameFields(table) {
    const renames = {
        'lock_benutzer': {
            'nr': 'id',
            'vorname': 'firstName',
            'nachname': 'lastName',
            'klasse': 'class',
            'tel': 'phone',
            'mobil': 'mobile',
            'email': 'email',
        },
        'lock_mieter': {
            'nr': 'id',
            'vorname': 'firstName',
            'nachname': 'lastName',
            'tel': 'phone',
            'mobil': 'mobile',
            'email': 'email',
        },
        'lock_schliessfach': {
            'nr': 'number',
            'benutzer': 'user',
            'mieter': 'renter',
            'auslaufdatum': 'expirationDate',
            'defekt': 'broken',
            'anmerkung': 'note',
        }
    };

    for (const tableName in renames) {
        if (table[tableName]) {
            for (const row of table[tableName]) {
                for (const oldName in renames[tableName]) {
                    const value = row[oldName];
                    delete row[oldName];
                    row[renames[tableName][oldName]] = value;
                }
            }
        }
    }

    return table;
}

// Insert table values
function insertValues(tables) {
    let insertInto = 'lock_schliessfach';
    let insertings = [
        {
            table: 'lock_benutzer',
            key: 'user',
            id: 'id',
        },
        {
            table: 'lock_mieter',
            key: 'renter',
            id: 'id',
        }
    ];
    for (let insertedRow of tables[insertInto]) {
        for (let inserting of insertings) {
            let insertingRow = tables[inserting.table].find(x => x[inserting.id] === insertedRow[inserting.key]);
            if (insertingRow) {
                insertedRow[inserting.key] = insertingRow;
            } else {
                warning('Could not find', inserting.key, insertedRow[inserting.key], 'in', inserting.table + ' at number', insertedRow.number);
                insertedRow[inserting.key] = null;
            }
        }
    }

    for (const inserting of insertings) {
        delete tables[inserting.table];
    }

    return tables;
}

// Get file from args
let file = process.argv[2];
if (!file) {
    error('Please provide a file to parse');
    process.exit(1);
}
let source = fs.readFileSync(file, 'utf8');
let tables = evaluateSQL(source);
tables = renameFields(tables);
tables = insertValues(tables);
// Check --format flag
let formatted = false;
for (const arg of process.argv) {
    if (arg.indexOf('--format') !== -1) {
        formatted = true;
    }
}
for (const tableName in tables) {
    if (formatted) {
        fs.writeFileSync(`./${tableName}.json`, JSON.stringify(tables[tableName], null, 2));
        success(`Wrote ${tableName}.json (formatted)`);
    } else {
        fs.writeFileSync(`./${tableName}.json`, JSON.stringify(tables[tableName]));
        success(`Wrote ${tableName}.json`);
    }
}

function warning(...args) {
    console.log(chalk.yellow(chalk.bold('warning:')), ...args);
}


function error(...args) {
    console.error(chalk.red(chalk.bold('error:')), ...args);
}

function success(...args) {
    console.log(chalk.blue(chalk.bold('success:')), ...args);
}