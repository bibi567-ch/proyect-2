let currentInput = '0';
let historyExpression = '';
let lastResult = null;
let isDegMode = true;
let isInvMode = false;
let isXlMode = false;
let isTfMode = false;

function updateDisplay() {
    const displayCurrent = document.getElementById('displayCurrent');
    const displayHistory = document.getElementById('displayHistory');
    
    displayCurrent.textContent = currentInput;
    displayHistory.textContent = historyExpression;
    
    displayCurrent.classList.remove('error');
}

function appendNumber(num) {
    if (currentInput === '0' || currentInput === 'Error') {
        currentInput = num;
    } else {
        currentInput += num;
    }
    updateDisplay();
    addPulseEffect(event.target);
}

function appendOperator(operator) {
    const lastChar = currentInput.slice(-1);
    
    if (['+', '-', '*', '/', '^'].includes(lastChar)) {
        currentInput = currentInput.slice(0, -1) + operator;
    } else if (currentInput !== '0' && currentInput !== 'Error') {
        currentInput += operator;
    }
    
    updateDisplay();
    addPulseEffect(event.target);
}

function appendDecimal() {
    const parts = currentInput.split(/[\+\-\*\/\^]/);
    const lastNumber = parts[parts.length - 1];
    
    if (!lastNumber.includes('.')) {
        if (currentInput === '0' || currentInput === 'Error') {
            currentInput = '0.';
        } else {
            currentInput += '.';
        }
    }
    
    updateDisplay();
    addPulseEffect(event.target);
}

function deleteChar() {
    if (currentInput.length > 1 && currentInput !== 'Error') {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    updateDisplay();
    addPulseEffect(event.target);
}

function clearDisplay() {
    currentInput = '0';
    historyExpression = '';
    lastResult = null;
    updateDisplay();
    addPulseEffect(event.target);
}

function calculate() {
    try {
        historyExpression = currentInput;
        
        let expression = currentInput
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/–/g, '-')
            .replace(/\^/g, '**');
        
        if (['+', '-', '*', '/', '**'].includes(expression.slice(-1))) {
            throw new Error('Expresión incompleta');
        }
        
        let result = evaluateExpression(expression);
        
        if (result % 1 !== 0) {
            result = Math.round(result * 1000000000) / 1000000000;
        }
        
        lastResult = result;
        currentInput = result.toString();
        historyExpression += ' =';
        
    } catch (error) {
        currentInput = 'Error';
        document.getElementById('displayCurrent').classList.add('error');
    }
    
    updateDisplay();
    addPulseEffect(event.target);
}

function evaluateExpression(expr) {
    expr = expr.replace(/\s/g, '');
    
    function parseNumber(str, index) {
        let num = '';
        while (index < str.length && (str[index].match(/[0-9.]/) || (str[index] === '-' && num === ''))) {
            num += str[index];
            index++;
        }
        return { value: parseFloat(num), endIndex: index };
    }
    
    function tokenize(expression) {
        const tokens = [];
        let i = 0;
        
        while (i < expression.length) {
            if (expression[i].match(/[0-9.]/)) {
                const result = parseNumber(expression, i);
                tokens.push(result.value);
                i = result.endIndex;
            } else if (['+', '-', '*', '/', '^'].includes(expression[i])) {
                if (expression[i] === '-' && (i === 0 || ['+', '-', '*', '/', '^', '('].includes(expression[i-1]))) {
                    const result = parseNumber(expression, i);
                    tokens.push(result.value);
                    i = result.endIndex;
                } else {
                    tokens.push(expression[i]);
                    i++;
                }
            } else if (expression[i] === '(') {
                tokens.push('(');
                i++;
            } else if (expression[i] === ')') {
                tokens.push(')');
                i++;
            } else {
                i++;
            }
        }
        
        return tokens;
    }
    
    function evaluateTokens(tokens) {
        const output = [];
        const operators = [];
        
        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2,
            '^': 3
        };
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (typeof token === 'number') {
                output.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                operators.pop();
            } else {
                while (operators.length > 0 && 
                       operators[operators.length - 1] !== '(' &&
                       precedence[token] <= precedence[operators[operators.length - 1]]) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }
        
        while (operators.length > 0) {
            output.push(operators.pop());
        }
        
        const stack = [];
        
        for (let i = 0; i < output.length; i++) {
            const token = output[i];
            
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                
                switch (token) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': 
                        if (b === 0) throw new Error('División por cero');
                        stack.push(a / b); 
                        break;
                    case '^': stack.push(Math.pow(a, b)); break;
                }
            }
        }
        
        return stack[0];
    }
    
    const tokens = tokenize(expr);
    return evaluateTokens(tokens);
}

function toggleMode(mode) {
    const button = event.target;
    
    switch(mode) {
        case 'deg':
            isDegMode = !isDegMode;
            button.textContent = isDegMode ? 'Deg' : 'Rad';
            break;
        case 'xl':
            isXlMode = !isXlMode;
            button.classList.toggle('active', isXlMode);
            break;
        case 'inv':
            isInvMode = !isInvMode;
            button.classList.toggle('active', isInvMode);
            break;
        case 'tf':
            isTfMode = !isTfMode;
            button.classList.toggle('active', isTfMode);
            break;
    }
    
    addPulseEffect(button);
}

function applyFunction(func) {
    let value = parseFloat(currentInput);
    
    if (isNaN(value)) {
        currentInput = 'Error';
        updateDisplay();
        return;
    }
    
    if (isDegMode && ['sin', 'cos', 'tan'].includes(func)) {
        value = value * Math.PI / 180;
    }
    
    let result;
    switch(func) {
        case 'sin':
            result = Math.sin(value);
            break;
        case 'cos':
            result = Math.cos(value);
            break;
        case 'tan':
            result = Math.tan(value);
            break;
        case 'ln':
            result = Math.log(value);
            break;
        case 'log':
            result = Math.log10(value);
            break;
        case 'sqrt':
            result = Math.sqrt(value);
            break;
        case 'exp':
            result = Math.exp(value);
            break;
    }
    
    if (result % 1 !== 0) {
        result = Math.round(result * 1000000000) / 1000000000;
    }
    
    currentInput = result.toString();
    updateDisplay();
    addPulseEffect(event.target);
}

function appendConstant(constant) {
    if (constant === 'e') {
        currentInput = currentInput === '0' || currentInput === 'Error' ? Math.E.toString() : currentInput + Math.E;
    }
    updateDisplay();
    addPulseEffect(event.target);
}

function calculatePercentage() {
    try {
        let value = parseFloat(currentInput);
        if (isNaN(value)) {
            throw new Error('Valor inválido');
        }
        
        currentInput = (value / 100).toString();
    } catch (error) {
        currentInput = 'Error';
        document.getElementById('displayCurrent').classList.add('error');
    }
    updateDisplay();
    addPulseEffect(event.target);
}

function appendAns() {
    if (lastResult !== null) {
        currentInput = currentInput === '0' || currentInput === 'Error' ? lastResult.toString() : currentInput + lastResult.toString();
        updateDisplay();
        addPulseEffect(event.target);
    }
}

function addPulseEffect(element) {
    element.classList.add('pulse');
    setTimeout(() => {
        element.classList.remove('pulse');
    }, 300);
}

document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    } else if (key === 'Backspace') {
        event.preventDefault();
        deleteChar();
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        clearDisplay();
    } else if (key === '^') {
        appendOperator('^');
    } else if (key === '%') {
        calculatePercentage();
    } else if (key === 'e' || key === 'E') {
        appendConstant('e');
    } else if (key === 'a' || key === 'A') {
        if (event.ctrlKey) event.preventDefault();
        else appendAns();
    }
});

updateDisplay();