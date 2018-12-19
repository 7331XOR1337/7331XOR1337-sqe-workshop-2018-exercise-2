import * as esprima from 'esprima';

const HandlerFunctionDictionary = {
    'FunctionDeclaration': FunctionDeclarationHandlerFunction,
    'WhileStatement': WhileStatementHandlerFunction, /* while(){}*/
    'IfStatement': IfStatementHandlerFunction, /*if(){}*/
    'ReturnStatement': ReturnStatementHandlerFunction, /*return */
    'AssignmentExpression': AssignmentExpressionHandlerFunction,
    'BinaryExpression': BinaryExpressionHandlerFunction,
    'MemberExpression': MemberExpressionHandlerFunction,
    'UnaryExpression': UnaryExpressionHandlerFunction,
    'Literal': LiteralHandlerFunction,
    'Identifier': IdentifierHandlerFunction,
    'UpdateExpression': UpdateExpressionHandlerFunction,
    'VariableDeclaration': VariableDeclarationHandlerFunction, /* let a */
    'ExpressionStatement': ExpressionStatementHandlerFunction, /* */
    'BlockStatement': BlockStatementHandlerFunction,
    'Program': BlockStatementHandlerFunction,
    'ArrayExpression': ArrayExpressionHandlerFunction,
    // 'ForStatement': ForStatementHandlerFunction, /* for (){}*/
    // 'VariableDeclarator': VariableDeclaratorHandlerFunction,
    // 'ElseIfStatement': ElseIfStatementHandlerFunction, /*else if*/ managed by IfStatementHandlerFunction
    // 'CallExpression': CallExpressionHandlerFunction, /* */
    // 'ArrayExpression': ArrayExpressionHandlerFunction, /* let a = []; */
};

export function generateColoredLine(lineValue, lineString, visitedColorClass = 'visited', unvisitedColorClass = 'unvisited') {
    let prefixString = '<pre class=';
    let suffixString = lineString + '</code></pre>';
    if (true === lineValue)
        return prefixString + visitedColorClass + '>' + '<code>' + suffixString;
    else if (false === lineValue)
        return prefixString + unvisitedColorClass + '>' + '<code>' + suffixString;
    else
        return '<pre><code>' + suffixString;
}

export function hasConditions(base, conditions) {
    if (undefined === conditions)
        return true;
    for (let condition in conditions) {
        if (!base.includes(conditions[condition]))
            return false;
    }
    return true;
}

// Globals
let lineNumber = 0;
let linesDictionary = {};
let elifConditionsDictionary = {};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true});
};

export function reset_globals() {
    lineNumber = 0;
    linesDictionary = {};
    elifConditionsDictionary = {};
}

export function startSubstitution(codeToParse, symbolDictionary) {
    reset_globals();
    let parsedCode = parseCode(codeToParse);
    return Substitute(parsedCode, symbolDictionary);
}

export function fetchNearestVal(inputLine, varValues, conditions) {
    let nearestLineStr = '';
    let minDiffValue = Number.MAX_VALUE;
    for (let variable in varValues) {
        let diffAbs = Math.abs(inputLine - varValues[variable].line);
        let isHasConditions = hasConditions(conditions, varValues[variable].conditions);
        if (diffAbs < minDiffValue && isHasConditions) {
            nearestLineStr = varValues[variable].value;
            minDiffValue = Math.abs(inputLine - varValues[variable].line);
        }
    }
    return nearestLineStr;
}

export function buildLineWithSpacing(lineNodes) {
    let line = '';
    for (let colIndex in lineNodes) {
        while (line.length < colIndex)
            line += ' ';
        line += lineNodes[colIndex];
    }
    return line;
}

export function LiteralHandlerFunction(node) {
    return node.raw;
}

export function BinaryExpressionHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let rightSide = createNodeByType(node.right, inputSet, symbolDictionary, conditions, isInFunc);
    let leftSide = createNodeByType(node.left, inputSet, symbolDictionary, conditions, isInFunc);
    let operator = node.operator;
    return leftSide + ' ' + operator + ' ' + rightSide;
}

export function MemberExpressionHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let variableName = node.object.name;
    let memberIndex = createNodeByType(node.property, inputSet, symbolDictionary, conditions, isInFunc);
    if (!inputSet.has(variableName)) {
        return fetchNearestVal(lineNumber, symbolDictionary[variableName], conditions)[memberIndex];
    }
    return variableName + '[' + memberIndex + ']';
}

export function createNodeByType(node, inputSet, symbolDictionary, conditions = [], isInFunc = false) {
    return HandlerFunctionDictionary[node.type](node, inputSet, symbolDictionary, conditions, isInFunc);
}

export function ExpressionStatementHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    return createNodeByType(node.expression, inputSet, symbolDictionary, conditions, isInFunc);
}

export function UnaryExpressionHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let operator = node.operator;
    let argument = createNodeByType(node.argument, inputSet, symbolDictionary, conditions, isInFunc);
    return operator + argument;
}

export function UpdateExpressionHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let operator = node.operator;
    let argument = createNodeByType(node.argument, inputSet, symbolDictionary, conditions, isInFunc);
    return argument + operator;
}

export function getConditionNodeFromStatement(inputLine, inputSet, symbolDictionary, conditions) {
    inputLine = inputLine.substring(inputLine.indexOf('if') - 1);
    inputLine += inputLine.endsWith('{') ? '}' : '{}';
    let condition = parseCode(inputLine).body[0].test; // Gets the condition
    return createNodeByType(condition, inputSet, symbolDictionary, conditions);
}

// eslint-disable-next-line no-unused-vars
export function IdentifierHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc = false) {
    let nodeStr = node.name;
    if (!inputSet.has(nodeStr)) {
        let value = fetchNearestVal(lineNumber, symbolDictionary[nodeStr], conditions);
        if (2 < value.length) {
            value = '(' + value + ')';
        }
        return value;
    }
    return nodeStr;
}

export function isLineToBePrinted(inputLine) {
    let trimmedLine = inputLine.trim(); // Remove spaces
    return isNotVarDeclaration(trimmedLine) && !trimmedLine.startsWith('while') && !trimmedLine.startsWith('return') && !trimmedLine.startsWith('function');
}

export function isNotVarDeclaration(trimmedLineStr) {
    return !trimmedLineStr.startsWith('const') && !trimmedLineStr.startsWith('var') && !trimmedLineStr.startsWith('let');
}

export function fetchVarVal(inputLine, variableValues, conditions, prefix = '[', suffix = ']') {
    let variableValueStr = fetchNearestVal(inputLine, variableValues, conditions);
    if (Array.isArray(variableValueStr))
        return prefix + variableValueStr + suffix;
    else
        return variableValueStr;
}

export function ArrayExpressionHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let nodeArray = [];
    node.elements.forEach(variable => {
        nodeArray.push(createNodeByType(variable, inputSet, symbolDictionary, conditions, isInFunc));
    });
    return nodeArray;
}

export function appendElif(type, inputLine) {
    elifConditionsDictionary[inputLine] = [];
    if ('else if' === type) {
        let lastCondition = Object.keys(elifConditionsDictionary)[Object.keys(elifConditionsDictionary).length - 2];
        elifConditionsDictionary[inputLine].push(lastCondition);
        elifConditionsDictionary[inputLine].push(...elifConditionsDictionary[lastCondition]);
    }
}

export function buildVariableStr(inputSet, name, variableValue, varDeclarationIndex, node) {
    let variableStr = '';
    inputSet.add(name);
    if (null == variableValue) {
        variableStr += name;
    }
    else {
        variableStr = appendVariableDeclarationStrAccordingToType(name, variableValue, variableStr);
    }
    let nodeDeclarationsLength = node.declarations.length;
    variableStr += varDeclarationIndex < nodeDeclarationsLength ? ', ' : ';';

    return variableStr;
}

export function appendVariableDeclarationStrAccordingToType(name, variableValue, stringToAppend) {
    let regularVariable = name + ' = ' + variableValue;
    let memberVariable = name + ' = [' + variableValue + ']';
    stringToAppend += !Array.isArray(variableValue) ? regularVariable : memberVariable;
    return stringToAppend;
}

export function buildVarDeclareStr(symbolDictionary, inputSet) {
    let variableDeclarationStr = '';
    inputSet.forEach(variable => {
        let prefix = 'let ' + variable + ' = ';
        let variableValue = fetchVarVal(lineNumber, symbolDictionary[variable], []);
        let suffix = ';';
        variableDeclarationStr += prefix + variableValue + suffix;
    });
    return variableDeclarationStr;
}

export function evaluateAndPrintLines(inputSet, symbolDictionary, functionString, functionCodeStr = '') {
    for (let line in linesDictionary) {
        let lineVal;
        let lineStr = buildLineWithSpacing(linesDictionary[line]);
        if (isLineToBePrinted(lineStr)) {
            if (lineStr.includes('if')) {
                let condition = getConditionNodeFromStatement(lineStr, inputSet, symbolDictionary);
                lineVal = eval(functionString + condition); // TODO: Fix coloring mistake
            }
            else {
                functionString += lineStr;
            }
        }
        functionCodeStr += generateColoredLine(lineVal, lineStr);
    }
    return functionCodeStr;
}

export function createFunctionString(symbolDictionary, inputSet) {
    let functionString = buildVarDeclareStr(symbolDictionary, inputSet);
    return evaluateAndPrintLines(inputSet, symbolDictionary, functionString);
}

export function AddNewEmptyLineToDictionary(line) {
    if (!(line in linesDictionary))
        linesDictionary[line] = {};
}

export function Substitute(parsedCode, symbolDictionary) {
    let nodeFunction;
    let inputSet = new Set([]);
    parsedCode.body.forEach(node => {
        if ('FunctionDeclaration' === node.type)
            nodeFunction = node;
        else
            createNodeByType(node, inputSet, symbolDictionary);
    });
    createNodeByType(nodeFunction, inputSet, symbolDictionary);
    return createFunctionString(symbolDictionary, inputSet);
}

export function IfStatementNodeAlternateHandlerFunction(node, inputSet, symbolDictionary, type, conditions, isInFunc) {
    let nodeAlternate = node.alternate;
    if ('IfStatement' === nodeAlternate.type)
        IfStatementHandlerFunction(nodeAlternate, inputSet, symbolDictionary, conditions, isInFunc, 'else if');
    else
        ElseStatementNodeHandlerFunction(node, inputSet, symbolDictionary, type, conditions, isInFunc);
}

export function ElseStatementNodeHandlerFunction(node, inputSet, symbolDictionary, type, conditions, isInFunc) {
    lineNumber = node.consequent.loc.end.line;
    conditions.push(lineNumber);
    appendElif(type, node.consequent.loc.end.line);
    AddLineToDictionary('else', node.consequent.loc.end, 0, 2);
    createNodeByType(node.alternate, inputSet, symbolDictionary, conditions, isInFunc);
    conditions.pop();
}

export function AddLineToDictionary(inputString, nodeLoc, lineDiff = 0, colDiff = 0) {
    let line = nodeLoc.line + lineDiff;
    let col = nodeLoc.column + colDiff;
    AddNewEmptyLineToDictionary(line);
    linesDictionary[line][col] = inputString;
}


export function WhileStatementHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    lineNumber = node.loc.start.line;
    let whileStr = buildWhileStr(node, inputSet, symbolDictionary, conditions, isInFunc);
    conditions.push(lineNumber);
    let nodeLocStart = node.loc.start;
    AddLineToDictionary(whileStr, nodeLocStart);
    createNodeByType(node.body, inputSet, symbolDictionary, conditions, isInFunc);
    conditions.pop();
}

export function buildWhileStr(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let whileConditionStr = createNodeByType(node.test, inputSet, symbolDictionary, conditions, isInFunc);
    return 'while(' + whileConditionStr + ')';
}

function memberAssignment(node, inputSet, symbolDictionary, conditions, value, insideFunction) {
    let memberName = node.left.object.name;
    let memberValue = fetchVarVal(lineNumber, symbolDictionary[memberName], conditions);
    let memberIndex = createNodeByType(node.left.property, inputSet, symbolDictionary, conditions, insideFunction);
    let assignmentToEval = 'let ' + memberName + '=' + memberValue + ';' + memberName + '[' + memberIndex + ']' + '=' + value + ';' + memberName;
    let newMemberValue = eval(assignmentToEval);
    pushSymbolToDict(node, conditions, newMemberValue, symbolDictionary, memberName);
    if (inputSet.has(memberName)) {
        AddAssignmentToDictionary(memberName, memberIndex, value, node);
    }
}

export function pushSymbolToDict(node, conditions, variableValue, symbolDictionary, name) {
    let symbolAddDict = {'line': node.loc.start.line, 'conditions': [...conditions], 'value': variableValue};
    symbolDictionary[name].push(symbolAddDict);
}

export function AddAssignmentToDictionary(memberName, memberIndex, value, node) {
    let assignmentStr = memberName + '[' + memberIndex + ']' + ' = ' + value + ';';
    let nodeLocStart = node.loc.start;
    AddLineToDictionary(assignmentStr, nodeLocStart);
}

export function ReturnStatementHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    let nodeLocStart = node.loc.start;
    lineNumber = nodeLocStart.line;
    let retValue = createNodeByType(node.argument, inputSet, symbolDictionary, conditions, isInFunc);
    AddLineToDictionary('return ' + retValue + ';', nodeLocStart);
}


export function BlockStatementHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    lineNumber = node.loc.line;
    let nodeLocStart = node.loc.start;
    buildBlockStr(nodeLocStart, node, inputSet, symbolDictionary, conditions, isInFunc);
}

export function buildBlockStr(nodeLocStart, node, inputSet, symbolDictionary, conditions, isInFunc) {
    AddLineToDictionary('{', nodeLocStart);
    node.body.forEach(internalNode => {
        createNodeByType(internalNode, inputSet, symbolDictionary, conditions, isInFunc);
    });
    let nodeLocEnd = node.loc.end;
    AddLineToDictionary('}', nodeLocEnd);
}

function IfStatementHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc, conditionTypeStr = 'if') {
    lineNumber = node.loc.start.line;
    let condition = createNodeByType(node.test, inputSet, symbolDictionary, conditions, isInFunc);
    let ifStatementStr = conditionTypeStr + ' (' + condition + ') ';
    conditions.push(lineNumber);
    buildIfStatement(conditionTypeStr, node.loc.start, ifStatementStr, node, inputSet, symbolDictionary, conditions, isInFunc);
    conditions.pop();
    if (null !== node.alternate && undefined !== node.alternate)
        IfStatementNodeAlternateHandlerFunction(node, inputSet, symbolDictionary, conditionTypeStr, conditions, isInFunc);
    return ifStatementStr;
}

export function buildIfStatement(type, nodeLocStart, ifStr, node, inputSet, symbolDictionary, conditions, isInFunc) {
    appendElif(type, nodeLocStart.line);
    if ('if' === type)
        AddLineToDictionary(ifStr, nodeLocStart);
    else
        AddLineToDictionary(ifStr, nodeLocStart, 0, -4);
    createNodeByType(node.consequent, inputSet, symbolDictionary, conditions, isInFunc);
}

function buildFunctionStr(nodeName, node, inputSet) {
    let retFunctionStr = 'function ' + nodeName + ' (';
    let currentIndex = 1;
    node.params.forEach(variable => {
        let variableName = variable.name;
        let paramLength = node.params.length;
        retFunctionStr += currentIndex < paramLength ? variableName + ',' : variableName + '';
        currentIndex += 1;
        inputSet.add(variable.name);
    });
    retFunctionStr += ')';
    return retFunctionStr;
}

function FunctionDeclarationHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    isInFunc;
    lineNumber = node.loc.start.line;
    let nodeName = node.id.name;
    let retFunctionStr = buildFunctionStr(nodeName, node, inputSet);
    let nodeLocStart = node.loc.start;
    AddLineToDictionary(retFunctionStr, nodeLocStart);
    createNodeByType(node.body, inputSet, symbolDictionary, conditions, true);
}

function buildVariableDeclarationStr(node, inputSet, symbolDictionary, conditions, isInFunc, varStr, declarationIndex) {
    node.declarations.forEach(declaration => {
        let variableValue = null;
        let declarationInit = declaration.init;
        if (null != declarationInit)
            variableValue = createNodeByType(declaration.init, inputSet, symbolDictionary, conditions, isInFunc);
        let declarationName = declaration.id.name;
        symbolDictionary[declarationName] = [];
        pushSymbolToDict(node, conditions, variableValue, symbolDictionary, declarationName);
        if (!isInFunc) {
            varStr += buildVariableStr(inputSet, declarationName, variableValue, declarationIndex, node);
            declarationIndex++;
        }
    });
    return varStr;
}

function VariableDeclarationHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    lineNumber = node.loc.start.line;
    let declarationIndex = 1, varDeclerationStr = '';
    varDeclerationStr = buildVariableDeclarationStr(node, inputSet, symbolDictionary, conditions, isInFunc, varDeclerationStr, declarationIndex);
    if (!isInFunc) {
        let nodeLocStart = node.loc.start;
        AddLineToDictionary(node.kind + ' ' + varDeclerationStr, nodeLocStart);
    }
}

export function AssignmentExpressionHandlerFunction(node, inputSet, symbolDictionary, conditions, isInFunc) {
    lineNumber = node.loc.start.line;
    let leftNodeName = node.left.name;
    let variableValue = createNodeByType(node.right, inputSet, symbolDictionary, conditions, isInFunc);
    let nodeLeft = node.left;
    if ('MemberExpression' === nodeLeft.type) {
        createNodeByType(nodeLeft, inputSet, symbolDictionary, conditions, isInFunc);
        memberAssignment(node, inputSet, symbolDictionary, conditions, variableValue, isInFunc);
    }
    else {
        pushSymbolToDict(node, conditions, variableValue, symbolDictionary, leftNodeName);
        if (inputSet.has(leftNodeName)) {
            let assignmentStr = leftNodeName + ' = ' + variableValue + ';';
            let nodeLocStart = node.loc.start;
            AddLineToDictionary(assignmentStr, nodeLocStart);
        }
    }
}