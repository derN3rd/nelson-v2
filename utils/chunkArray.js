module.exports = (myArray, chunkSize) => {
  const results = []

  const arrayCopy = [...myArray]
  while (arrayCopy.length) {
    results.push(arrayCopy.splice(0, chunkSize))
  }

  return results
}
