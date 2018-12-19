import $ from 'jquery';
import {startSubstitution} from './substitutor';

$(document).ready(function () {
    $('#newArgumentBtn').click(() => {
        let stringToAdd = createHTMLArg();
        $('#newArgumentTable').append(stringToAdd);
    });

    $('#codeSubmissionButton').click(() => {
        codeSubmissionClicked();
    });
});

function createHTMLArg() {
    let varNameHTMLStr = '<td><label>Var Name: <input id="varName" type="text"></label></td>';
    let varValueHTMLStr = '<td><label>Var Value: <input id="varValue" type="text"></label></td>';
    return '<tr class="newArgCells">' + varNameHTMLStr + varValueHTMLStr + '</tr>';
}

function getNewArgs() {
    let argName = $(this).find('#varName').val();
    let argValue = $(this).find('#varValue').val();
    return {newArgName: argName, newArgValue: argValue};
}

function pushNewArgumentsToSymbolDictionary(symbolDictionary, argName, argValue) {
    symbolDictionary[argName] = [];
    symbolDictionary[argName].push({'line': 0, 'conditions': [], 'value': argValue});
}

function codeSubmissionClicked() {
    let symbolDictionary = {};
    $('tr.newArgCells').each(function () {
        let {newArgName, newArgValue} = getNewArgs.call(this);
        if (newArgValue.startsWith('[')) {
            newArgValue = newArgValue.substring(1, newArgValue.length - 1).replace(/ /g, '').split(',');
        }
        pushNewArgumentsToSymbolDictionary(symbolDictionary, newArgName, newArgValue);
    });
    let codeToParse = $('#codePlaceholder').val();
    let functionString = startSubstitution(codeToParse, symbolDictionary);
    $('#substitutionResult').html(functionString);
}
