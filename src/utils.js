module.exports = {
    getNames: (existedNames, length) => {
        let newNames = new Array;
        for (let i = 1; i <= length; i++) {
            if (!existedNames.includes(i)) {
                newNames.push(i)
            }
        }
        return newNames
    },

    checkAccess: (req, res, next) => {

    }
}
