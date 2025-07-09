/**
 * @param {string} s
 * @return {number}
 */
var romanToInt = function(s) {
    var numbers = {
        'I': 1,
        'V': 5,
        'X': 10,
        'L': 50,
        'C': 100,
        'D': 500,
        'M': 1000,
    };
    
    let total = 0; // Variable to hold the total value
    let prevValue = 0; // Variable to hold the previous numeral value

    for (let i = 0; i < s.length; i++) {
        const currentValue = numbers[s[i]];
        // console.log(currentValue);
        
        // If the current value is greater than the previous value, it means we have a subtractive case
        if (currentValue > prevValue) {
            total += currentValue - 2 * prevValue; // Subtract the previous value twice and add the current value
        } else {
            total += currentValue; // Otherwise, just add the current value
        }

        prevValue = currentValue; // Update the previous value to the current value
    }

    return total; // Return the total value
};

console.log(romanToInt('V')); // Output: 5
console.log(romanToInt('IV')); // Output: 4
console.log(romanToInt('XLII')); // Output: 42
console.log(romanToInt('MCMXCIV')); // Output: 1994
