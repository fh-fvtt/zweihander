/**
 * Helper function used to check ItemData duplicates between two given datasets.
 */ 
const findDifference = (datasetA, datasetB) => {
  let diffArray = [];

  for (let elementA of datasetA)
    if (!datasetB.some(elementB => elementB.name === elementA.name))
      diffArray.push(elementA);

  return diffArray;
};

/**
 * Helper function that returns the symmetric difference between two datasets (xor operation).
 * 
 * @param {*} datasetA 
 * @param {*} datasetB 
 * @returns The unique elements of datasetA and datasetB.
 */
const getSymmetricDifference = (datasetA, datasetB) => {
  return findDifference(datasetA, datasetB).concat(findDifference(datasetB, datasetA));
}

/**
 * Helper function that returns the difference between two arrays (minus operation).
 * 
 * @param {Array} arrayA 
 * @param {Array} arrayB 
 * @returns The elements of arrayA that are not present in arrayB.
 */
const getArrayDifference = (arrayA, arrayB) => {
  return arrayA.filter(element => !arrayB.includes(element));
}

/**
 * Helper function that checks whether an object is empty or not.
 * 
 * @param {object} object The object to be checked
 * @returns 
 */

const isObjectEmpty = (object) => {
  return !object || !Object.keys(object).length;
}

export default {
  findDifference,
  getArrayDifference,
  getSymmetricDifference,
  isObjectEmpty
}