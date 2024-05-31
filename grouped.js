function groupEntries(entries) {
    let groupedEntries = [];
    let temp = [];

    for (let i = 0; i < entries.length; i++) {
        if (entries[i].success) {
            if (temp.length === 0 || (temp[temp.length - 1].success === entries[i].success)) {
                temp.push(entries[i]);
            } else {
                groupedEntries.push(temp);
                temp = [entries[i]];
            }
        } else if (temp.length > 0) {
            groupedEntries.push(temp);
            temp = [];
        }
    }

    if (temp.length > 0) {
        groupedEntries.push(temp);
    }

    return groupedEntries;
}

const x = require('./test-results.json')

console.log(groupEntries(x).map(v => `${v[0].version} - ${v[v.length - 1].version}`).join('|| '))