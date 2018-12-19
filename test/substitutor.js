import assert from 'assert';
import {startSubstitution, generateColoredLine} from '../src/js/substitutor';

describe('Test generateColoredLine', () => {
    it('Test 1 - Green color for visited line', () => {
        assert.equal(
            generateColoredLine(true, 'if(inVariable>10)'), '<pre class=visited><code>if(inVariable>10)</code></pre>'
        );
    });
    it('Test 2 - Red color for unvisited line', () => {
        assert.equal(
            generateColoredLine(false, 'if(inVariable<10)'), '<pre class=unvisited><code>if(inVariable<10)</code></pre>'
        );
    });
    it('Test 3 - No color', () => {
        assert.equal(
            generateColoredLine(null, 'let a = 5;'), '<pre><code>let a = 5;</code></pre>'
        );
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function newSymbolDictForDict(lineNumber, conditions, value) {
    return {'line': lineNumber, 'conditions:': conditions, 'value:': value};
}

function createSymbolsTest3() {
    let symbolDictionary = {};
    symbolDictionary['x'] = [];
    symbolDictionary['y'] = [];
    symbolDictionary['z'] = [];
    symbolDictionary['x'].push(newSymbolDictForDict(0, [], 1));
    symbolDictionary['y'].push(newSymbolDictForDict(0, [], 2));
    symbolDictionary['z'].push(newSymbolDictForDict(0, [], 3));
    return symbolDictionary;
}

describe('Test variable substitution 1', () => {
    it('Replace local variable - no symbolDictionary', () => {
        assert.equal(
            startSubstitution(
                'function foo(x){\n' +
                '    let temp=x;\n' +
                '    return temp;\n' +
                '}',
                {}),
            '<pre><code>function foo (x){</code></pre><pre><code>    return x;</code></pre><pre><code> }</code></pre>'
        );
    });
});

describe('Test variable substitution 2', () => {
    it('Symbolic substitution - with simple symbolDictionary - Should be the same as prev test', () => {
        let symbolDictionary = {};
        symbolDictionary['x'] = [];
        symbolDictionary['x'].push(newSymbolDictForDict(0, [], 15));
        assert.equal(
            startSubstitution(
                'function foo(x){\n' +
                '    let temp=x;\n' +
                '    return temp;\n' +
                '}',
                {symbolDictionary}),
            '<pre><code>function foo (x){</code></pre><pre><code>    return x;</code></pre><pre><code> }</code></pre>'
        );
    });
});

describe('Test variable substitution 3', () => {
    it('Symbolic substitution with params', () => {
        let symbolDictionary = createSymbolsTest3();
        let a = '<pre><code>function foo (x,y,z)  {</code></pre><pre class=unvisited><code>    if (y < 9) {</code></pre><pre><code>        return (x * z);</code></pre><pre><code>     }</code></pre><pre><code>    return x;</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'function foo (x, y, z){\n' +
                '    let temp = x * z;\n' +
                '    if(y < 9){\n' +
                '        return temp;\n' +
                '    }\n' +
                '    return x;\n' +
                '}',
                symbolDictionary), a);
    });
});
describe('Test variable substitution 4', () => {
    it('Symbolic substitution with unary', () => {
        let symbolDictionary = createSymbolsTest3();
        let a = '<pre><code>function foo (x,y,z)  {</code></pre><pre class=visited><code>    if (!y) {</code></pre><pre><code>        return (x + 1);</code></pre><pre><code>     }</code></pre><pre><code>    return z;</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'function foo (x, y, z){\n' +
                '    let temp = x+1;\n' +
                '    if(!y){\n' +
                '        return temp;\n' +
                '    }\n' +
                '    return z;\n' +
                '}',
                symbolDictionary), a);
    });
});
describe('Test variable substitution 5', () => {
    it('Symbolic substitution with if else', () => {
        let a = '<pre><code>let x = 5;</code></pre><pre><code>function foo (){</code></pre><pre class=visited><code>    if ((x + 1) > 1) {</code></pre><pre><code>        return x;</code></pre><pre><code>     } else</code></pre><pre><code>        {</code></pre><pre><code>        return 6;</code></pre><pre><code>     }</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'let x = 5;\n' +
                'function foo (){\n' +
                '    let temp = x + 1;\n' +
                '    if(temp > 1){\n' +
                '        return x;\n' +
                '    }\n' +
                '    else{\n' +
                '        return 6;\n' +
                '    }\n' +
                '}', {}), a
        );
    });
});
describe('Test variable substitution 6', () => {
    it('Symbolic substitution with while + var', () => {
        let a = '<pre><code>var x = 5;</code></pre><pre><code>var y = 1;</code></pre><pre><code>function foo (){</code></pre><pre><code>    while((x + 1) > y){</code></pre><pre><code>     }</code></pre><pre><code>    return (x + 1);</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'var x = 5;\n' +
                'var y = 1;\n' +
                'function foo (){\n' +
                '    let temp = x + 1;\n' +
                '    while(temp > y){\n' +
                '        temp = temp / 2;\n' +
                '    }\n' +
                '    return temp;\n' +
                '}', {}), a
        );
    });
});
describe('Test variable substitution 7', () => {
    it('Symbolic substitution with if inside if - should be visited twice', () => {
        let a = '<pre><code>const y = 5;</code></pre><pre><code>function foo (){</code></pre><pre class=visited><code>    if ((y * 2) > 5) {</code></pre><pre class=visited><code>        if ((y * 2) > 9) {</code></pre><pre><code>            return (y * 2);</code></pre><pre><code>         }</code></pre><pre><code>     }</code></pre><pre><code>    return (y * 2);</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'const y = 5;\n' +
                'function foo (){\n' +
                '    let temp = y*2;\n' +
                '    if(temp > 5){\n' +
                '        if(temp > 9){\n' +
                '            return temp;\n' +
                '        }\n' +
                '    }\n' +
                '    return temp;\n' +
                '}', {}), a
        );
    });
});
describe('Test variable substitution 8', () => {
    it('Symbolic substitution with if inside if - should be visited twice', () => {
        let a = '<pre><code>function foo (x,y,z)  {</code></pre><pre class=unvisited><code>    if (6 == 7)               {</code></pre><pre><code>        return (y * 2) + z;</code></pre><pre><code>     }</code></pre><pre><code>    return x;</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'function foo (x, y, z){\n' +
                '    var numArr = [5, 6, 7, 8];\n' +
                '    let temp = y*2;\n' +
                '    if(numArr[1] == numArr[2]){\n' +
                '        return temp + z;\n' +
                '    }\n' +
                '    return x;\n' +
                '}', createSymbolsTest3()), a
        );
    });
});
describe('Test variable substitution 8', () => {
    it('Symbolic substitution with if inside if - should be visited twice', () => {
        let a = '<pre><code>function foo (x,y,z)  {</code></pre><pre class=unvisited><code>    if (6 == 7)               {</code></pre><pre><code>        return (y * 2) + z;</code></pre><pre><code>     }</code></pre><pre><code>    return x;</code></pre><pre><code> }</code></pre>';
        assert.equal(
            startSubstitution(
                'function foo (x, y, z){\n' +
                '    var numArr = [5, 6, 7, 8];\n' +
                '    let temp = y*2;\n' +
                '    if(numArr[1] == numArr[2]){\n' +
                '        return temp + z;\n' +
                '    }\n' +
                '    return x;\n' +
                '}', createSymbolsTest3()), a
        );
    });
});


