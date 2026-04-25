const availableNumbers = Array.from({ length: 1028 }, (_, i) => i + 1);

function getRandomNumberFromPool() {
    if (!availableNumbers.length) {
        return null;
    }
    const index = Math.floor(Math.random() * availableNumbers.length);
    return availableNumbers[index];
}

function removeNumberFromPool(number) {
    const index = availableNumbers.indexOf(number);
    if (index !== -1) {
        availableNumbers.splice(index, 1);
    }
}
